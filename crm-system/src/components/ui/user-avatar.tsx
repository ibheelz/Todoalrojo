'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  email?: string | null;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Consistent user avatar component using DiceBear API
 * Generates the same avatar for the same user across all pages
 */
export function UserAvatar({
  email,
  name,
  firstName,
  lastName,
  className,
  size = 'md',
}: UserAvatarProps) {
  // Determine the seed for consistent avatar generation
  // Priority: email > name > firstName+lastName
  const seed = email || name || `${firstName || ''}-${lastName || ''}`;

  // Generate consistent DiceBear avatar URL
  // Using 'avataaars' style for friendly, consistent avatars
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

  // Get initials for fallback
  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Size classes
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={avatarUrl} alt={name || email || 'User'} />
      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
}
