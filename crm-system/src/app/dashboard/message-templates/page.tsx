'use client';

import { useState, useEffect } from 'react';
import { Mail, MessageSquare, Plus, Edit2, Trash2, Eye, Save, X, Building2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface MessageTemplate {
  id: string;
  operatorId: string;
  journeyType: 'ACQUISITION' | 'RETENTION';
  messageType: 'WELCOME' | 'BONUS_REMINDER' | 'SOCIAL_PROOF' | 'URGENCY' | 'FINAL_NUDGE' | 'RELOAD' | 'VIP_OFFER';
  dayNumber: number;
  channel: 'EMAIL' | 'SMS';
  subject: string | null;
  content: string;
  ctaLink: string | null;
  ctaText: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Operator {
  id: string;
  name: string;
  brand: string;
}

export default function MessageTemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedOperator, setSelectedOperator] = useState<string>('all');
  const [selectedJourney, setSelectedJourney] = useState<string>('all');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);

  const [formData, setFormData] = useState({
    operatorId: '',
    journeyType: 'ACQUISITION' as 'ACQUISITION' | 'RETENTION',
    messageType: 'WELCOME' as MessageTemplate['messageType'],
    dayNumber: 0,
    channel: 'EMAIL' as 'EMAIL' | 'SMS',
    subject: '',
    content: '',
    ctaLink: '',
    ctaText: '',
    isActive: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [templatesRes, operatorsRes] = await Promise.all([
        fetch('/api/message-templates'),
        fetch('/api/operators')
      ]);

      const templatesData = await templatesRes.json();
      const operatorsData = await operatorsRes.json();

      if (templatesData.success) {
        setTemplates(templatesData.templates);
      }

      if (operatorsData.success) {
        setOperators(operatorsData.operators || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const response = await fetch('/api/message-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setTemplates([...templates, data.template]);
        setShowCreateModal(false);
        resetForm();
      } else {
        alert(data.error || 'Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Failed to create template');
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      const response = await fetch(`/api/message-templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: formData.subject,
          content: formData.content,
          ctaLink: formData.ctaLink,
          ctaText: formData.ctaText,
          isActive: formData.isActive
        })
      });

      const data = await response.json();

      if (data.success) {
        setTemplates(templates.map(t => t.id === data.template.id ? data.template : t));
        setShowEditModal(false);
        setSelectedTemplate(null);
        resetForm();
      } else {
        alert(data.error || 'Failed to update template');
      }
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Failed to update template');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/message-templates/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setTemplates(templates.filter(t => t.id !== id));
      } else {
        alert(data.error || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const openEditModal = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      operatorId: template.operatorId,
      journeyType: template.journeyType,
      messageType: template.messageType,
      dayNumber: template.dayNumber,
      channel: template.channel,
      subject: template.subject || '',
      content: template.content,
      ctaLink: template.ctaLink || '',
      ctaText: template.ctaText || '',
      isActive: template.isActive
    });
    setShowEditModal(true);
  };

  const openPreviewModal = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setShowPreviewModal(true);
  };

  const resetForm = () => {
    setFormData({
      operatorId: '',
      journeyType: 'ACQUISITION',
      messageType: 'WELCOME',
      dayNumber: 0,
      channel: 'EMAIL',
      subject: '',
      content: '',
      ctaLink: '',
      ctaText: '',
      isActive: true
    });
  };

  const getOperatorName = (operatorId: string) => {
    const operator = operators.find(op => op.id === operatorId);
    return operator?.name || operator?.brand || 'Unknown';
  };

  const getChannelIcon = (channel: string) => {
    return channel === 'EMAIL' ? <Mail className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />;
  };

  const getMessageTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ');
  };

  const filteredTemplates = templates.filter(template => {
    if (selectedOperator !== 'all' && template.operatorId !== selectedOperator) return false;
    if (selectedJourney !== 'all' && template.journeyType !== selectedJourney) return false;
    if (selectedChannel !== 'all' && template.channel !== selectedChannel) return false;
    return true;
  });

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const key = `${template.operatorId}-${template.journeyType}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(template);
    return acc;
  }, {} as Record<string, MessageTemplate[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Message Templates</h1>
          <p className="text-gray-400 mt-1">
            Customize messages for each stage, brand, and journey type
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="premium-button flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="premium-button flex items-center gap-2 bg-purple-500 hover:bg-purple-600"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="premium-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Brand/Operator</label>
            <select
              value={selectedOperator}
              onChange={(e) => setSelectedOperator(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
            >
              <option value="all">All Brands</option>
              {operators.map(op => (
                <option key={op.id} value={op.id}>{op.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Journey Type</label>
            <select
              value={selectedJourney}
              onChange={(e) => setSelectedJourney(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
            >
              <option value="all">All Journeys</option>
              <option value="ACQUISITION">Acquisition</option>
              <option value="RETENTION">Retention</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Channel</label>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
            >
              <option value="all">All Channels</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      {Object.keys(groupedTemplates).length === 0 ? (
        <div className="premium-card text-center py-12">
          <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">No templates yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Create your first message template to start customizing your customer journey
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="premium-button inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTemplates).map(([key, templates]) => {
            const [operatorId, journeyType] = key.split('-');
            return (
              <div key={key} className="premium-card">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-semibold text-white">
                    {getOperatorName(operatorId)}
                  </h2>
                  <span className="text-sm text-gray-400">•</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    journeyType === 'ACQUISITION'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {journeyType}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {templates
                    .sort((a, b) => a.dayNumber - b.dayNumber)
                    .map(template => (
                      <div
                        key={template.id}
                        className={`bg-white/5 rounded-lg p-4 border ${
                          template.isActive ? 'border-white/20' : 'border-gray-600/30'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getChannelIcon(template.channel)}
                            <div>
                              <h3 className="font-medium text-white">
                                {getMessageTypeLabel(template.messageType)}
                              </h3>
                              <p className="text-sm text-gray-400">Day {template.dayNumber}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {!template.isActive && (
                              <span className="px-2 py-1 rounded text-xs bg-gray-600/30 text-gray-400">
                                Inactive
                              </span>
                            )}
                            <button
                              onClick={() => openPreviewModal(template)}
                              className="p-1.5 hover:bg-white/10 rounded transition-colors"
                              title="Preview"
                            >
                              <Eye className="w-4 h-4 text-gray-400" />
                            </button>
                            <button
                              onClick={() => openEditModal(template)}
                              className="p-1.5 hover:bg-white/10 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4 text-gray-400" />
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </div>

                        {template.channel === 'EMAIL' && template.subject && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-400">Subject:</p>
                            <p className="text-sm text-white truncate">{template.subject}</p>
                          </div>
                        )}

                        <div className="mb-2">
                          <p className="text-xs text-gray-400">Message:</p>
                          <p className="text-sm text-white line-clamp-2">{template.content}</p>
                        </div>

                        {template.ctaText && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                            <button className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1.5 rounded border border-purple-500/30">
                              {template.ctaText}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-white/20 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Create Message Template</h2>
              <button
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="p-2 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Brand *</label>
                  <select
                    value={formData.operatorId}
                    onChange={(e) => setFormData({ ...formData, operatorId: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="">Select Brand</option>
                    {operators.map(op => (
                      <option key={op.id} value={op.id}>{op.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Journey Type *</label>
                  <select
                    value={formData.journeyType}
                    onChange={(e) => setFormData({ ...formData, journeyType: e.target.value as any })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="ACQUISITION">Acquisition</option>
                    <option value="RETENTION">Retention</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Message Type *</label>
                  <select
                    value={formData.messageType}
                    onChange={(e) => setFormData({ ...formData, messageType: e.target.value as any })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="WELCOME">Welcome</option>
                    <option value="BONUS_REMINDER">Bonus Reminder</option>
                    <option value="SOCIAL_PROOF">Social Proof</option>
                    <option value="URGENCY">Urgency</option>
                    <option value="FINAL_NUDGE">Final Nudge</option>
                    <option value="RELOAD">Reload</option>
                    <option value="VIP_OFFER">VIP Offer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Day Number *</label>
                  <input
                    type="number"
                    value={formData.dayNumber}
                    onChange={(e) => setFormData({ ...formData, dayNumber: parseInt(e.target.value) })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Channel *</label>
                  <select
                    value={formData.channel}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value as any })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="EMAIL">Email</option>
                    <option value="SMS">SMS</option>
                  </select>
                </div>
              </div>

              {formData.channel === 'EMAIL' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Subject Line</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                    placeholder="Enter email subject..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Message Content *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white h-32"
                  placeholder="Enter your message content..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {'{firstName}'}, {'{lastName}'}, {'{brandName}'} for personalization
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">CTA Text</label>
                  <input
                    type="text"
                    value={formData.ctaText}
                    onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                    placeholder="e.g., Claim Bonus"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">CTA Link</label>
                  <input
                    type="url"
                    value={formData.ctaLink}
                    onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm text-gray-400">
                  Active (template will be used in journeys)
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {showEditModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-white/20 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Edit Message Template</h2>
              <button
                onClick={() => { setShowEditModal(false); setSelectedTemplate(null); resetForm(); }}
                className="p-2 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-sm text-gray-400">
                <strong className="text-white">{getOperatorName(selectedTemplate.operatorId)}</strong> • {selectedTemplate.journeyType} • Day {selectedTemplate.dayNumber} • {selectedTemplate.channel}
              </p>
            </div>

            <div className="space-y-4">
              {formData.channel === 'EMAIL' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Subject Line</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Message Content *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white h-32"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">CTA Text</label>
                  <input
                    type="text"
                    value={formData.ctaText}
                    onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">CTA Link</label>
                  <input
                    type="url"
                    value={formData.ctaLink}
                    onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActiveEdit"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isActiveEdit" className="text-sm text-gray-400">
                  Active (template will be used in journeys)
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowEditModal(false); setSelectedTemplate(null); resetForm(); }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTemplate}
                className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-white/20 p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Message Preview</h2>
              <button
                onClick={() => { setShowPreviewModal(false); setSelectedTemplate(null); }}
                className="p-2 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  {getChannelIcon(selectedTemplate.channel)}
                  <span className="text-sm text-gray-400">{selectedTemplate.channel}</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-sm text-gray-400">Day {selectedTemplate.dayNumber}</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-sm text-gray-400">{getMessageTypeLabel(selectedTemplate.messageType)}</span>
                </div>

                {selectedTemplate.channel === 'EMAIL' && selectedTemplate.subject && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-400 mb-1">Subject:</p>
                    <p className="text-white font-medium">{selectedTemplate.subject}</p>
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-xs text-gray-400 mb-2">Message:</p>
                  <p className="text-white whitespace-pre-wrap">{selectedTemplate.content}</p>
                </div>

                {selectedTemplate.ctaText && (
                  <div className="pt-4 border-t border-white/10">
                    <button className="px-6 py-3 bg-purple-500 text-white rounded-lg font-medium">
                      {selectedTemplate.ctaText}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>Brand: <strong className="text-white">{getOperatorName(selectedTemplate.operatorId)}</strong></span>
                <span className="text-gray-600">•</span>
                <span>Journey: <strong className="text-white">{selectedTemplate.journeyType}</strong></span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => { setShowPreviewModal(false); setSelectedTemplate(null); }}
                className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
