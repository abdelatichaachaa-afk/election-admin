export default function ComingSoon({ title }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-3">{title}</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
        هذه الصفحة قيد الإنشاء — سنبنيها في الخطوة القادمة.
      </div>
    </div>
  )
}
