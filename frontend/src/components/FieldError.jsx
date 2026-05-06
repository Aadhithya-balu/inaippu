const FieldError = ({ error }) =>
  error ? <p className="text-xs text-red-500 font-semibold mt-1 ml-1">{error}</p> : null;

export default FieldError;
