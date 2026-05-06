// Sanitize: strip HTML/script tags only (no trim — trimming on keystroke blocks spaces)
export const sanitize = (val) =>
  typeof val === 'string' ? val.replace(/<[^>]*>/g, '') : val;

// Individual validators
const validators = {
  required: (val) => !val?.toString().trim() ? 'This field is required.' : null,
  aadhaar:  (val) => !/^\d{12}$/.test(val?.toString().trim()) ? 'Aadhaar must be exactly 12 digits.' : null,
  phone:    (val) => !/^\d{10}$/.test(val?.toString().trim()) ? 'Phone must be exactly 10 digits.' : null,
  email:    (val) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val?.toString().trim()) ? 'Enter a valid email address.' : null,
  password: (val) => val?.length < 6 ? 'Password must be at least 6 characters.' : null,
};

// Validate a single value against an array of rule names
export const validateField = (value, rules = []) => {
  for (const rule of rules) {
    const err = validators[rule]?.(value);
    if (err) return err;
  }
  return null;
};

// Validate a full object given a rules map: { fieldKey: ['required', 'email'] }
export const validateAll = (data, rulesMap) => {
  const errors = {};
  for (const [key, rules] of Object.entries(rulesMap)) {
    const err = validateField(data[key], rules);
    if (err) errors[key] = err;
  }
  return errors;
};

// Validate dynamic schema fields from backend JSON schema
export const validateDynamicSchema = (data, schema) => {
  const errors = {};
  for (const field of schema) {
    if (field.required && !data[field.key]?.toString().trim()) {
      errors[field.key] = `${field.label} is required.`;
    }
  }
  return errors;
};

// Scroll to first element with data-error="true"
export const scrollToFirstError = () => {
  const el = document.querySelector('[data-error="true"]');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
};
