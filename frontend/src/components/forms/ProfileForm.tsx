// frontend/src/components/forms/ProfileForm.tsx
import { useForm, Controller } from "react-hook-form";
import { cn } from "../../lib/utils";
import { Input, Textarea, Select, Checkbox } from "./FormField";
import {
  GENDER_OPTIONS,
  GENDER_LABELS,
  ACADEMIC_LEVELS,
  ACADEMIC_LEVEL_LABELS,
} from "../../lib/constants";
import type { StudentProfileFormData } from "../../api/types";

// ============================================================================
// Gender Options
// ============================================================================

const genderOptions = [
  { value: GENDER_OPTIONS.MALE, label: GENDER_LABELS[GENDER_OPTIONS.MALE] },
  { value: GENDER_OPTIONS.FEMALE, label: GENDER_LABELS[GENDER_OPTIONS.FEMALE] },
  { value: GENDER_OPTIONS.OTHER, label: GENDER_LABELS[GENDER_OPTIONS.OTHER] },
  {
    value: GENDER_OPTIONS.PREFER_NOT_TO_SAY,
    label: GENDER_LABELS[GENDER_OPTIONS.PREFER_NOT_TO_SAY],
  },
];

// ============================================================================
// ProfileForm Component
// ============================================================================

interface ProfileFormProps {
  defaultValues?: Partial<StudentProfileFormData>;
  disabled?: boolean;
  onSubmit: (data: StudentProfileFormData) => void | Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
  className?: string;
}

export function ProfileForm({
  defaultValues,
  disabled = false,
  onSubmit,
  submitLabel = "Save Changes",
  isSubmitting = false,
  className,
}: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<StudentProfileFormData>({
    defaultValues: {
      gender: null,
      date_of_birth: null,
      city: "",
      state: "",
      linkedin_url: "",
      github_url: "",
      portfolio_url: "",
      placement_opt_in: true,
      guardian_phone: "",
      ...defaultValues,
    },
    mode: "onChange",
  });

  // Profile completeness calculation
  const watchedFields = watch();
  const completeness = calculateCompleteness(watchedFields);

  const onFormSubmit = async (data: StudentProfileFormData) => {
    // Convert empty strings to null for optional fields
    const cleanedData: StudentProfileFormData = {
      ...data,
      gender: data.gender || null,
      date_of_birth: data.date_of_birth || null,
      city: data.city || null,
      state: data.state || null,
      linkedin_url: data.linkedin_url || null,
      github_url: data.github_url || null,
      portfolio_url: data.portfolio_url || null,
      guardian_phone: data.guardian_phone || null,
    };
    await onSubmit(cleanedData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className={cn("space-y-6", className)} noValidate>
      {/* Profile Completeness Indicator */}
      <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Profile Completeness
          </span>
          <span className="text-sm font-semibold text-primary">{completeness}%</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${completeness}%` }}
          />
        </div>
      </div>

      {/* Personal Details Section */}
      <fieldset className="space-y-6">
        <legend className="text-lg font-semibold text-gray-900 dark:text-white">
          Personal Details
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <Select
                label="Gender"
                options={genderOptions}
                placeholder="Select gender"
                disabled={disabled}
                {...field}
                error={errors.gender?.message}
              />
            )}
          />

          <Controller
            name="date_of_birth"
            control={control}
            render={({ field }) => (
              <Input
                label="Date of Birth"
                type="date"
                max={new Date().toISOString().split("T")[0]}
                disabled={disabled}
                {...field}
                error={errors.date_of_birth?.message}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <Input
                label="City"
                placeholder="Mumbai"
                disabled={disabled}
                {...field}
                error={errors.city?.message}
              />
            )}
          />

          <Controller
            name="state"
            control={control}
            render={({ field }) => (
              <Input
                label="State"
                placeholder="Maharashtra"
                disabled={disabled}
                {...field}
                error={errors.state?.message}
              />
            )}
          />
        </div>

        <Controller
          name="guardian_phone"
          control={control}
          render={({ field }) => (
            <Input
              label="Guardian Phone"
              type="tel"
              placeholder="+91 9876543210"
              disabled={disabled}
              {...field}
              error={errors.guardian_phone?.message}
            />
          )}
        />
      </fieldset>

      {/* Online Profiles Section */}
      <fieldset className="space-y-6">
        <legend className="text-lg font-semibold text-gray-900 dark:text-white">
          Online Profiles
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Controller
            name="linkedin_url"
            control={control}
            render={({ field }) => (
              <Input
                label="LinkedIn URL"
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                disabled={disabled}
                {...field}
                error={errors.linkedin_url?.message}
              />
            )}
          />

          <Controller
            name="github_url"
            control={control}
            render={({ field }) => (
              <Input
                label="GitHub URL"
                type="url"
                placeholder="https://github.com/yourusername"
                disabled={disabled}
                {...field}
                error={errors.github_url?.message}
              />
            )}
          />

          <Controller
            name="portfolio_url"
            control={control}
            render={({ field }) => (
              <Input
                label="Portfolio URL"
                type="url"
                placeholder="https://yourportfolio.dev"
                disabled={disabled}
                {...field}
                error={errors.portfolio_url?.message}
              />
            )}
          />
        </div>
      </fieldset>

      {/* Placement Preferences */}
      <fieldset className="space-y-6">
        <legend className="text-lg font-semibold text-gray-900 dark:text-white">
          Placement Preferences
        </legend>

        <Controller
          name="placement_opt_in"
          control={control}
          render={({ field }) => (
            <Checkbox
              label="I want to participate in campus placements"
              hint="Uncheck if you're not looking for placement opportunities"
              disabled={disabled}
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
              error={errors.placement_opt_in?.message}
            />
          )}
        />
      </fieldset>

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="submit"
          disabled={disabled || isSubmitting || !isValid}
          className={cn(
            "px-6 py-2.5 rounded-lg font-medium text-white",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900",
            "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
            "bg-primary hover:bg-primary/90",
          )}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving...
            </span>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// Helper: Calculate Profile Completeness
// ============================================================================

function calculateCompleteness(data: Partial<StudentProfileFormData>): number {
  const fields = [
    "gender",
    "date_of_birth",
    "city",
    "state",
    "linkedin_url",
    "github_url",
    "portfolio_url",
    "guardian_phone",
  ] as const;

  const filled = fields.filter((field) => {
    const value = data[field];
    return value !== undefined && value !== null && value !== "";
  }).length;

  return Math.round((filled / fields.length) * 100);
}

export default ProfileForm;
