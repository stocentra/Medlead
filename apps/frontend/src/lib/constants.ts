// Based on the user_professional_level ENUM in the database
export const professionalLevels = [
  { value: 'medical_student_physiopathology', label: 'Medical Student (Physiopathology)' },
  { value: 'medical_student_stager', label: 'Medical Student (Stager)' },
  { value: 'intern', label: 'Intern' },
  { value: 'general_practitioner', label: 'General Practitioner' },
  { value: 'resident', label: 'Resident' },
  { value: 'specialist', label: 'Specialist' },
  { value: 'attending', label: 'Attending' },
]

export const professionalLevelLabels: { [key: string]: string } =
  professionalLevels.reduce((acc, level) => {
    acc[level.value] = level.label
    return acc
  }, {} as { [key:string]: string })

// New: Specialty data moved here from specialties.json
export const specialties = [
  {"id":1,"name":"Allergy and Immunology"},
  {"id":2,"name":"Anesthesiology"},
  {"id":3,"name":"Dermatology"},
  {"id":4,"name":"Diagnostic Radiology"},
  {"id":5,"name":"Emergency Medicine"},
  {"id":6,"name":"Family Medicine"},
  {"id":7,"name":"Internal Medicine"},
  {"id":8,"name":"Medical Genetics"},
  {"id":9,"name":"Neurology"},
  {"id":10,"name":"Neurosurgery"},
  {"id":11,"name":"Nuclear Medicine"},
  {"id":12,"name":"Obstetrics and Gynecology"},
  {"id":13,"name":"Ophthalmology"},
  {"id":14,"name":"Orthopedic Surgery"},
  {"id":15,"name":"Otolaryngology (ENT)"},
  {"id":16,"name":"Pathology"},
  {"id":17,"name":"Pediatrics"},
  {"id":18,"name":"Physical Medicine and Rehabilitation"},
  {"id":19,"name":"Plastic Surgery"},
  {"id":20,"name":"Preventive Medicine"},
  {"id":21,"name":"Psychiatry"},
  {"id":22,"name":"Radiation Oncology"},
  {"id":23,"name":"General Surgery"},
  {"id":24,"name":"Urology"},
  {"id":25,"name":"Cardiology"},
  {"id":26,"name":"Endocrinology"},
  {"id":27,"name":"Hospital Medicine"},
  {"id":28,"name":"Radiology"},
]