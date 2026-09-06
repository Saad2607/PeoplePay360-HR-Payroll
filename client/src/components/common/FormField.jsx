import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * FormField - Enterprise reusable form input wrapper supporting text, email,
 * password, number, select, textarea, validation error messages, and icons.
 *
 * @param {Object} props
 * @param {string} [props.label] - Field label text
 * @param {string} [props.id] - Field HTML id attribute
 * @param {string} [props.name] - Field name
 * @param {string} [props.type='text'] - Input type (text, email, password, number, date, select, textarea)
 * @param {any} props.value - Controlled input value
 * @param {Function} props.onChange - Input change callback
 * @param {string} [props.placeholder] - Placeholder text
 * @param {boolean} [props.required=false] - Whether field is required
 * @param {string} [props.error] - Validation error message
 * @param {string} [props.helperText] - Supplementary hint text
 * @param {React.ElementType} [props.icon] - Leading Lucide icon component
 * @param {Array<{ value: string|number, label: string }|string>} [props.options] - Options if type is 'select'
 * @param {boolean} [props.disabled=false] - Whether input is disabled
 * @param {number} [props.rows=3] - Rows if type is 'textarea'
 * @param {React.ReactNode} [props.children] - Custom input element override
 * @param {string} [props.className=''] - Container classes
 */
export const FormField = ({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helperText,
  icon: Icon,
  options = [],
  disabled = false,
  rows = 3,
  children,
  className = '',
  ...rest
}) => {
  const fieldId = id || name;

  const baseInputStyles = `w-full rounded-xl border text-sm transition focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed ${
    error
      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/20 text-rose-900'
      : 'border-gray-300 focus:border-brand-500 focus:ring-brand-100 bg-white text-gray-900'
  } ${Icon ? 'pl-10' : 'px-3.5'} py-2.5`;

  const renderControl = () => {
    if (children) return children;

    if (type === 'select') {
      return (
        <select
          id={fieldId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`${baseInputStyles} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M7%208l3%203%203-3%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-9`}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt, idx) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const text = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={idx} value={val}>
                {text}
              </option>
            );
          })}
        </select>
      );
    }

    if (type === 'textarea') {
      return (
        <textarea
          id={fieldId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={rows}
          className={baseInputStyles}
          {...rest}
        />
      );
    }

    return (
      <input
        type={type}
        id={fieldId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={baseInputStyles}
        {...rest}
      />
    );
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={fieldId}
          className="block text-xs font-semibold text-gray-700 uppercase tracking-wider"
        >
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        {renderControl()}
      </div>

      {error ? (
        <p className="text-xs text-rose-600 flex items-center mt-1">
          <AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-gray-400 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
};
