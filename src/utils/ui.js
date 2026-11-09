/** Shared UI helpers */

export const urgencyBadgeClass = (urgency) =>
  ({
    Critical: 'bg-red-700 text-white',
    High: 'bg-red-200 text-red-900',
    Medium: 'bg-yellow-200 text-yellow-900',
    Low: 'bg-green-200 text-green-900',
  })[urgency] || 'bg-gray-200 text-gray-800'
