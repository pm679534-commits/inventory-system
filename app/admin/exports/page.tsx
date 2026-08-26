import { FileText } from 'lucide-react';

export default function AdminExportsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Exports</h1>
        <p className="text-gray-600">Export data and generate reports</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h3>
          <p className="text-gray-600">
            Export and reporting features will be available in the next phase
          </p>
        </div>
      </div>
    </div>
  );
}
