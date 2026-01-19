import { colors } from '../config/colors';

export default function Hero() {
  return (
    <div className={`bg-gradient-to-r ${colors.gradients.hero} text-white py-12 px-4`}>
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-3">
          Order Online
        </h2>
        <p className="text-lg sm:text-xl text-teal-50">
          Fresh African & Caribbean Groceries
        </p>
      </div>
    </div>
  );
}
