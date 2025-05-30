import Image from 'next/image';
import { Profile } from '@/lib/stores/use-profile-store';
import { VerifiedIcon } from '@/components/common/icons';

interface ProfileCardProps {
  profile: Profile;
  showEditButton?: boolean;
  onEdit?: () => void;
}

export function ProfileCard({ profile, showEditButton = false, onEdit }: ProfileCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="relative h-32 bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="absolute -bottom-16 left-4">
          <div className="relative w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden">
            <Image
              src={profile.avatarUrl || '/images/default-avatar.png'}
              alt={profile.name}
              fill
              className="object-cover"
            />
          </div>
        </div>
        {showEditButton && onEdit && (
          <button
            onClick={onEdit}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-md transition-colors"
          >
            Edit Profile
          </button>
        )}
      </div>

      <div className="pt-20 p-4">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {profile.name}
          </h2>
          {profile.isVerified && (
            <VerifiedIcon className="w-6 h-6 text-primary-600" />
          )}
        </div>

        <div className="flex items-center gap-4 mb-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {profile.type ? profile.type.replace('_', ' ') : 'Unknown Type'} {/* Check for type */}
          </span>
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {profile.ratings?.average ? profile.ratings.average.toFixed(1) : 'N/A'} {/* Check for ratings */}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
              {profile.ratings?.count ? `(${profile.ratings.count} reviews)` : '(0 reviews)'} {/* Check for ratings count */}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Location
            </h3>
            <p className="text-sm text-gray-900 dark:text-white">
              {profile.location?.address || 'Location not provided'} {/* Check for location */}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Contact
            </h3>
            <p className="text-sm text-gray-900 dark:text-white">
              {profile.email}
              {profile.phone && (
                <>
                  <br />
                  {profile.phone}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-3">
            Environmental Impact
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-green-700 dark:text-green-300">CO2 Saved</p>
              <p className="text-lg font-medium text-green-800 dark:text-green-200">
                {profile.environmentalImpact.co2Saved.toFixed(1)}kg
              </p>
            </div>
            <div>
              <p className="text-sm text-green-700 dark:text-green-300">E-waste Diverted</p>
              <p className="text-lg font-medium text-green-800 dark:text-green-200">
                {profile.environmentalImpact.eWasteDiverted.toFixed(1)}kg
              </p>
            </div>
            <div>
              <p className="text-sm text-green-700 dark:text-green-300">Items Traded</p>
              <p className="text-lg font-medium text-green-800 dark:text-green-200">
                {profile.environmentalImpact.itemsTraded}
              </p>
            </div>
            <div>
              <p className="text-sm text-green-700 dark:text-green-300">Items Repaired</p>
              <p className="text-lg font-medium text-green-800 dark:text-green-200">
                {profile.environmentalImpact.itemsRepaired}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}