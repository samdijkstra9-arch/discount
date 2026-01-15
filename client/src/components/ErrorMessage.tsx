interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <div className="text-red-500 text-4xl mb-3">⚠️</div>
      <p className="text-red-700 font-medium mb-2">Er ging iets mis</p>
      <p className="text-red-600 text-sm mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary">
          Opnieuw proberen
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
