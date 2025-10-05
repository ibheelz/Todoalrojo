import { prisma } from './prisma';
import { OperatorStatus } from '@prisma/client';

/**
 * Operator Service
 * Manages multi-operator segmentation and recycling logic
 */

export interface CreateOperatorInput {
  clientId: string;
  name: string;
  slug: string;
  brand?: string;
  emailDomain?: string;
  emailFromName?: string;
  emailFromAddress?: string;
  logoUrl?: string;
  primaryColor?: string;
  smsEnabled?: boolean;
  smsSender?: string;
  smsProvider?: string;
  protectHighValue?: boolean;
  recycleAfterDays?: number;
  minStageForRecycle?: number;
  maxStageForRecycle?: number;
}

export interface RecyclingEligibilityCheck {
  customerId: string;
  currentOperatorId: string;
  targetOperatorId: string;
}

export interface RecyclingEligibilityResult {
  eligible: boolean;
  reason?: string;
  customerStage?: number;
  daysSinceDeposit?: number;
  recycleCount?: number;
}

class OperatorService {
  /**
   * Create a new operator
   */
  static async createOperator(data: CreateOperatorInput) {
    return await prisma.operator.create({
      data: {
        ...data,
        status: OperatorStatus.ACTIVE,
      },
    });
  }

  /**
   * Get operator by ID or slug
   */
  static async getOperator(idOrSlug: string) {
    return await prisma.operator.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug },
        ],
      },
      include: {
        recyclingRules: true,
      },
    });
  }

  /**
   * Get all operators for a client
   */
  static async getClientOperators(clientId: string) {
    return await prisma.operator.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update operator status
   */
  static async updateOperatorStatus(operatorId: string, status: OperatorStatus) {
    return await prisma.operator.update({
      where: { id: operatorId },
      data: { status },
    });
  }

  /**
   * Check if a customer is eligible for recycling from one operator to another
   */
  static async checkRecyclingEligibility({
    customerId,
    currentOperatorId,
    targetOperatorId,
  }: RecyclingEligibilityCheck): Promise<RecyclingEligibilityResult> {
    // Get customer's journey state with current operator
    const currentJourneyState = await prisma.customerJourneyState.findUnique({
      where: {
        customerId_operatorId: {
          customerId,
          operatorId: currentOperatorId,
        },
      },
    });

    if (!currentJourneyState) {
      return {
        eligible: true,
        reason: 'No journey with current operator',
      };
    }

    // Get current operator config
    const currentOperator = await prisma.operator.findUnique({
      where: { id: currentOperatorId },
    });

    if (!currentOperator) {
      return { eligible: false, reason: 'Current operator not found' };
    }

    // Check if customer is high-value and protected
    if (currentOperator.protectHighValue && currentJourneyState.stage >= 3) {
      return {
        eligible: false,
        reason: 'High-value player protected',
        customerStage: currentJourneyState.stage,
      };
    }

    // Check operator status
    if (currentOperator.status === OperatorStatus.ACTIVE) {
      // Active operator - check stage and time limits
      if (
        currentJourneyState.stage < currentOperator.minStageForRecycle ||
        currentJourneyState.stage > currentOperator.maxStageForRecycle
      ) {
        return {
          eligible: false,
          reason: `Stage ${currentJourneyState.stage} not eligible for recycling`,
          customerStage: currentJourneyState.stage,
        };
      }

      // Check days since last deposit
      if (currentJourneyState.lastDepositAt) {
        const daysSinceDeposit = Math.floor(
          (Date.now() - currentJourneyState.lastDepositAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceDeposit < currentOperator.recycleAfterDays) {
          return {
            eligible: false,
            reason: `Must wait ${currentOperator.recycleAfterDays} days since last deposit`,
            daysSinceDeposit,
          };
        }
      }
    } else if (currentOperator.status === OperatorStatus.PAUSED) {
      // Paused operator - protect all players
      return {
        eligible: false,
        reason: 'Operator paused - all players protected',
      };
    }
    // INACTIVE and TESTING operators allow recycling

    // Check if recycling rule exists
    const recyclingRule = await prisma.operatorRecyclingRule.findUnique({
      where: {
        sourceOperatorId_targetOperatorId: {
          sourceOperatorId: currentOperatorId,
          targetOperatorId,
        },
      },
    });

    if (recyclingRule && recyclingRule.isActive) {
      // Check stage eligibility
      if (
        currentJourneyState.stage < recyclingRule.minStage ||
        currentJourneyState.stage > recyclingRule.maxStage
      ) {
        return {
          eligible: false,
          reason: `Stage ${currentJourneyState.stage} not eligible per recycling rule`,
          customerStage: currentJourneyState.stage,
        };
      }

      // Check high-value exclusion
      if (recyclingRule.excludeHighValue && currentJourneyState.stage >= 3) {
        return {
          eligible: false,
          reason: 'High-value player excluded by rule',
          customerStage: currentJourneyState.stage,
        };
      }

      // Check days since deposit
      if (currentJourneyState.lastDepositAt) {
        const daysSinceDeposit = Math.floor(
          (Date.now() - currentJourneyState.lastDepositAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceDeposit < recyclingRule.minDaysSinceLastDeposit) {
          return {
            eligible: false,
            reason: `Must wait ${recyclingRule.minDaysSinceLastDeposit} days since last deposit`,
            daysSinceDeposit,
          };
        }
      }

      // Check recycle count limit
      const recycleCount = await prisma.customerRecyclingHistory.count({
        where: {
          customerId,
          fromOperatorId: currentOperatorId,
          toOperatorId: targetOperatorId,
        },
      });

      if (recycleCount >= recyclingRule.maxRecyclesPerUser) {
        return {
          eligible: false,
          reason: `Max recycles (${recyclingRule.maxRecyclesPerUser}) reached`,
          recycleCount,
        };
      }

      // Check cooldown
      const lastRecycle = await prisma.customerRecyclingHistory.findFirst({
        where: {
          customerId,
          fromOperatorId: currentOperatorId,
          toOperatorId: targetOperatorId,
        },
        orderBy: { recycledAt: 'desc' },
      });

      if (lastRecycle) {
        const daysSinceRecycle = Math.floor(
          (Date.now() - lastRecycle.recycledAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceRecycle < recyclingRule.cooldownDays) {
          return {
            eligible: false,
            reason: `Must wait ${recyclingRule.cooldownDays} days between recycles`,
          };
        }
      }
    }

    // Check if customer already has journey with target operator
    const targetJourneyState = await prisma.customerJourneyState.findUnique({
      where: {
        customerId_operatorId: {
          customerId,
          operatorId: targetOperatorId,
        },
      },
    });

    if (targetJourneyState) {
      return {
        eligible: false,
        reason: 'Customer already has journey with target operator',
      };
    }

    // All checks passed
    return {
      eligible: true,
      customerStage: currentJourneyState.stage,
      daysSinceDeposit: currentJourneyState.lastDepositAt
        ? Math.floor((Date.now() - currentJourneyState.lastDepositAt.getTime()) / (1000 * 60 * 60 * 24))
        : undefined,
    };
  }

  /**
   * Find eligible customers for recycling
   */
  static async findEligibleCustomersForRecycling(
    sourceOperatorId: string,
    targetOperatorId: string,
    limit: number = 100
  ) {
    // Get all customers with the source operator
    const journeyStates = await prisma.customerJourneyState.findMany({
      where: {
        operatorId: sourceOperatorId,
      },
      include: {
        customer: true,
      },
      take: limit * 2, // Get more to filter
    });

    const eligibleCustomers = [];

    for (const state of journeyStates) {
      const eligibility = await this.checkRecyclingEligibility({
        customerId: state.customerId,
        currentOperatorId: sourceOperatorId,
        targetOperatorId,
      });

      if (eligibility.eligible) {
        eligibleCustomers.push({
          customer: state.customer,
          journeyState: state,
          eligibility,
        });

        if (eligibleCustomers.length >= limit) {
          break;
        }
      }
    }

    return eligibleCustomers;
  }

  /**
   * Recycle a customer to a new operator
   */
  static async recycleCustomer(
    customerId: string,
    fromOperatorId: string,
    toOperatorId: string
  ) {
    // Check eligibility
    const eligibility = await this.checkRecyclingEligibility({
      customerId,
      currentOperatorId: fromOperatorId,
      targetOperatorId: toOperatorId,
    });

    if (!eligibility.eligible) {
      throw new Error(`Customer not eligible for recycling: ${eligibility.reason}`);
    }

    // Get current journey state
    const currentState = await prisma.customerJourneyState.findUnique({
      where: {
        customerId_operatorId: {
          customerId,
          operatorId: fromOperatorId,
        },
      },
    });

    // Create recycling history record
    const historyRecord = await prisma.customerRecyclingHistory.create({
      data: {
        customerId,
        fromOperatorId,
        toOperatorId,
        stageAtRecycle: currentState?.stage || -1,
        daysSinceDeposit: eligibility.daysSinceDeposit,
        lastDepositAmount: currentState?.totalDepositValue,
      },
    });

    return {
      success: true,
      historyRecord,
      eligibility,
    };
  }

  /**
   * Create recycling rule between operators
   */
  static async createRecyclingRule(
    sourceOperatorId: string,
    targetOperatorId: string,
    options: {
      minDaysSinceLastDeposit?: number;
      maxStage?: number;
      minStage?: number;
      excludeHighValue?: boolean;
      maxRecyclesPerUser?: number;
      cooldownDays?: number;
      priority?: number;
    }
  ) {
    return await prisma.operatorRecyclingRule.create({
      data: {
        sourceOperatorId,
        targetOperatorId,
        ...options,
      },
    });
  }

  /**
   * Update operator metrics
   */
  static async updateOperatorMetrics(
    operatorId: string,
    metrics: {
      leads?: number;
      registrations?: number;
      ftd?: number;
      deposits?: number;
      revenue?: number;
      journeysStarted?: number;
      messagesSent?: number;
      messagesFailed?: number;
      recycledIn?: number;
      recycledOut?: number;
    }
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await prisma.operatorMetrics.upsert({
      where: {
        operatorId_date: {
          operatorId,
          date: today,
        },
      },
      create: {
        operatorId,
        date: today,
        ...metrics,
      },
      update: {
        leads: { increment: metrics.leads || 0 },
        registrations: { increment: metrics.registrations || 0 },
        ftd: { increment: metrics.ftd || 0 },
        deposits: { increment: metrics.deposits || 0 },
        revenue: { increment: metrics.revenue || 0 },
        journeysStarted: { increment: metrics.journeysStarted || 0 },
        messagesStart: { increment: metrics.messagesSent || 0 },
        messagesFailed: { increment: metrics.messagesFailed || 0 },
        recycledIn: { increment: metrics.recycledIn || 0 },
        recycledOut: { increment: metrics.recycledOut || 0 },
      },
    });
  }

  /**
   * Calculate operator quality rates
   */
  static async calculateOperatorRates(operatorId: string) {
    const operator = await prisma.operator.findUnique({
      where: { id: operatorId },
    });

    if (!operator) return null;

    const regRate = operator.totalLeads > 0
      ? operator.totalRegistrations / operator.totalLeads
      : 0;

    const ftdRate = operator.totalRegistrations > 0
      ? operator.totalFTD / operator.totalRegistrations
      : 0;

    await prisma.operator.update({
      where: { id: operatorId },
      data: {
        regRate,
        ftdRate,
      },
    });

    return { regRate, ftdRate };
  }

  /**
   * Get operator dashboard stats
   */
  static async getOperatorStats(operatorId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = await prisma.operatorMetrics.findMany({
      where: {
        operatorId,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    const totalLeads = metrics.reduce((sum, m) => sum + m.leads, 0);
    const totalRegistrations = metrics.reduce((sum, m) => sum + m.registrations, 0);
    const totalFTD = metrics.reduce((sum, m) => sum + m.ftd, 0);
    const totalRevenue = metrics.reduce((sum, m) => sum + Number(m.revenue), 0);
    const totalRecycledIn = metrics.reduce((sum, m) => sum + m.recycledIn, 0);
    const totalRecycledOut = metrics.reduce((sum, m) => sum + m.recycledOut, 0);

    const regRate = totalLeads > 0 ? (totalRegistrations / totalLeads) * 100 : 0;
    const ftdRate = totalRegistrations > 0 ? (totalFTD / totalRegistrations) * 100 : 0;

    return {
      period: { days, startDate, endDate: new Date() },
      totals: {
        leads: totalLeads,
        registrations: totalRegistrations,
        ftd: totalFTD,
        revenue: totalRevenue,
        recycledIn: totalRecycledIn,
        recycledOut: totalRecycledOut,
      },
      rates: {
        regRate: regRate.toFixed(2),
        ftdRate: ftdRate.toFixed(2),
      },
      dailyMetrics: metrics,
    };
  }
}

export default OperatorService;
