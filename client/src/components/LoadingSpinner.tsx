interface LoadingSpinnerProps {
  message?: string;
}

function LoadingSpinner({ message = 'Laden...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      <p className="mt-4 text-gray-500">{message}</p>
    </div>
  );
}

export default LoadingSpinner;
