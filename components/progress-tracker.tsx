export interface ProgressTrackerProps {
  currentStep: number
  totalSteps: number
  steps: string[]
}

export function ProgressTracker({ currentStep, totalSteps, steps }: ProgressTrackerProps) {
  return (
    <div className="mb-8 print:hidden">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === currentStep
          const isCompleted = stepNumber < currentStep

          return (
            <div key={index} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                    isCompleted
                      ? "bg-green-500 border-green-500 text-white"
                      : isActive
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "bg-gray-100 border-gray-300 text-gray-500"
                  }`}
                >
                  {isCompleted ? "✓" : stepNumber}
                </div>
                <span
                  className={`mt-2 text-xs text-center max-w-20 ${
                    isActive ? "text-blue-600 font-medium" : "text-gray-500"
                  }`}
                >
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${stepNumber < currentStep ? "bg-green-500" : "bg-gray-300"}`} />
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4">
        <div className="bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Step {currentStep} of {totalSteps}
        </p>
      </div>
    </div>
  )
}
