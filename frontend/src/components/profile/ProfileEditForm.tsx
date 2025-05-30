// frontend/src/components/profile/ProfileEditForm.tsx
import { useState, useEffect } from 'react';
import { useProfileStore, Profile } from '@/lib/stores/use-profile-store';
import { ImageUpload } from '@/components/common/ImageUpload';
import { Alert } from '@/components/ui/Alert';
import { Loading } from '@/components/common/Loading';

interface ProfileEditFormProps {
  onCancel: () => void;
}

export function ProfileEditForm({ onCancel }: ProfileEditFormProps) {
  const { profile, updateProfile, updateAvatar, loading, error } = useProfileStore();
  const [formData, setFormData] = useState<Partial<Profile>>({
    name: profile?.name || '',
    phone: profile?.phone || '',
    location: profile?.location || {
      address: ''
    }
  });

  // Update formData when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        phone: profile.phone,
        location: profile.location || { address: '' }
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(formData);
    if (!error) {
      onCancel();
    }
  };

  const handleImageChange = async (files: File[]) => {
    if (files.length > 0) {
      await updateAvatar(files[0]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {/* Avatar Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Profile Picture
        </label>
        <ImageUpload
          images={profile?.avatarUrl ? [profile.avatarUrl] : []}
          onChange={handleImageChange}
          onRemove={() => {/* TODO: Implement avatar removal */}}
          maxFiles={1}
        />
      </div>

      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Name
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
        />
      </div>

      {/* Phone */}
      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Phone Number (optional)
        </label>
        <input
          type="tel"
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Location */}
      <div>
        <label
          htmlFor="address"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Address
        </label>
        <input
          type="text"
          id="address"
          value={formData.location?.address}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            location: { ...prev.location!, address: e.target.value }
          }))}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
        />
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          We'll use this to show your location to other users
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md
                   hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {loading ? <Loading size="small" /> : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300
                   py-2 px-4 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600
                   transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}