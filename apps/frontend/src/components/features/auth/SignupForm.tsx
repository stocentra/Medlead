// frontend/src/components/features/auth/SignupForm.tsx

import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect, useState } from 'react'
// Corrected: useNavigate is no longer needed in this component
import 'react-phone-number-input/style.css'
import { getCountries, getCountryCallingCode } from 'react-phone-number-input/input'
import en from 'react-phone-number-input/locale/en.json'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useAuthStore } from '@/store/useAuthStore'
import { professionalLevels, specialties } from '@/lib/constants'
import { Icon } from '@iconify/react'

const signupSchema = z.object({
  fullName: z.string().min(3, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  professionalLevel: z.string().min(1, 'Professional level is required'),
  country: z.string().min(1, "Country is required"),
  city: z.string().optional(),
  phoneNumber: z.string().optional(),
  university: z.string().optional(),
  studentId: z.string().optional(),
  medicalLicenseNumber: z.string().optional(),
  specialtyId: z.string().optional(),
  nationalId: z.string().optional(),
  gender: z.string().optional(),
  document: z.instanceof(FileList).optional(),
})

type SignupFormInputs = z.infer<typeof signupSchema>

const countryOptions = getCountries().sort().map((countryCode) => ({
    value: countryCode,
    label: en[countryCode],
}));

interface SignupFormProps {
  onToggleView: () => void;
}

const SignupForm = ({ onToggleView }: SignupFormProps) => {
  // Corrected: Removed unused 'navigate' declaration
  const registerUser = useAuthStore((state) => state.register)
  const status = useAuthStore((state) => state.status)
  const message = useAuthStore((state) => state.message)
  
  const [callingCode, setCallingCode] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<SignupFormInputs>({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
  })

  const professionalLevel = watch('professionalLevel')
  const selectedCountry = watch('country')

  useEffect(() => {
    if (selectedCountry) {
      const code = getCountryCallingCode(selectedCountry as any)
      setCallingCode(`+${code}`)
      setValue('phoneNumber', '') 
    } else {
      setCallingCode('')
    }
  }, [selectedCountry, setValue])

  const isStudent = professionalLevel && ['intern', 'medical_student_stager', 'medical_student_physiopathology'].includes(professionalLevel)
  const isDoctor = professionalLevel && ['general_practitioner', 'resident', 'specialist', 'attending'].includes(professionalLevel)
  const canSelectSpecialty = professionalLevel && ['resident', 'specialist', 'attending'].includes(professionalLevel)

  const isLoading = status === 'loading'

  // --- MODIFIED FUNCTION ---
  const onSubmit: SubmitHandler<SignupFormInputs> = async (data) => {
    // Extract the file from the FileList
    const documentFile = data.document && data.document.length > 0 ? data.document[0] : undefined;

    // The rest of your logic for phone number, etc. can remain here
    const fullPhoneNumber = data.phoneNumber ? `${callingCode}${data.phoneNumber}` : undefined;
    console.log("Full form data captured:", { ...data, phoneNumber: fullPhoneNumber, country_specific_details: { city: data.city } });

    // Call registerUser with all data, including the document file
    await registerUser({
      full_name: data.fullName,
      email: data.email,
      password: data.password,
      country: data.country,
      professional_level: data.professionalLevel,
      document: documentFile, // +++ Pass the file to the store action
    })
  }
  // --- END OF MODIFIED FUNCTION ---

  const handleBackToLogin = () => {
    useAuthStore.getState().clearStatus()
    onToggleView()
  }

  if (status === 'success' && message) {
    return (
      <div className="w-full max-w-md text-center">
        <Icon icon="lucide:check-circle" className="mx-auto h-12 w-12 text-status-success mb-4" />
        <h2 className="text-xl font-semibold">Registration Successful</h2>
        <p className="mt-2 text-text-secondary">{message}</p>
        <p className="mt-4 text-sm text-text-secondary">
          Once your identity is verified by our team, you will be notified via email and full access to the chat will be granted.
        </p>
        <Button onClick={handleBackToLogin} className="mt-6">
          Back to Login
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input placeholder="Full Name" {...register('fullName')} />
        {errors.fullName && <p className="text-sm text-status-error mt-1">{errors.fullName.message}</p>}

        <Input placeholder="Email Address" type="email" {...register('email')} />
        {errors.email && <p className="text-sm text-status-error mt-1">{errors.email.message}</p>}

        <Input placeholder="Password" type="password" {...register('password')} />
        {errors.password && <p className="text-sm text-status-error mt-1">{errors.password.message}</p>}
        
        <Select
          placeholder="Select Professional Level"
          options={professionalLevels}
          {...register('professionalLevel')}
        />
        {errors.professionalLevel && <p className="text-sm text-status-error mt-1">{errors.professionalLevel.message}</p>}

        {professionalLevel && (
          <Select placeholder="Select Country" options={countryOptions} {...register('country')} />
        )}
        {errors.country && <p className="text-sm text-status-error mt-1">{errors.country.message}</p>}

        {selectedCountry && (
          <>
            <Input placeholder="City" {...register('city')} />
            
            <div>
              <label className="text-sm font-medium text-gray-700">Phone Number</label>
              <div className="mt-1 flex items-center rounded-md border border-gray-300 bg-transparent ring-offset-background focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
                {callingCode && (
                  <span className="pl-3 pr-2 text-sm text-text-secondary border-r border-gray-300">
                    {callingCode}
                  </span>
                )}
                <Input
                  type="tel"
                  placeholder="Your phone number"
                  {...register('phoneNumber')}
                  className="border-0 h-[38px] flex-1 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              {errors.phoneNumber && <p className="text-sm text-status-error mt-1">{errors.phoneNumber.message}</p>}
            </div>
          </>
        )}
        
        {isStudent && (
          <>
            <Input placeholder="University Name" {...register('university')} />
            <Input placeholder="Student ID Number" {...register('studentId')} />
            <div>
              <label className="text-sm font-medium text-gray-700">Student ID Card</label>
              <Input type="file" {...register('document')} className="mt-1" />
            </div>
          </>
        )}
        
        {isDoctor && (
          <>
            <Input placeholder="Medical License Number" {...register('medicalLicenseNumber')} />
            
            {canSelectSpecialty && (
               <Select
                placeholder="Select Specialty"
                options={specialties.map(s => ({ value: s.id.toString(), label: s.name }))}
                {...register('specialtyId')}
              />
            )}
            
            <div>
              <label className="text-sm font-medium text-gray-700">Medical License Card</label>
              <Input type="file" {...register('document')} className="mt-1"/>
            </div>
          </>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>
       <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onToggleView}
            className="font-medium text-primary hover:underline focus:outline-none"
          >
            Sign In
          </button>
        </p>
    </div>
  )
}

export default SignupForm