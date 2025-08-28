import React from 'react';
import { CloudSun, Thermometer, Droplets, Wind } from 'lucide-react';

interface WeatherProps {
  temperature: number;
  weather: string;
  location: string;
  humidity?: number;
  windSpeed?: number;
  description?: string;
  aiResponse?: string;
}

export const Weather: React.FC<WeatherProps> = ({ 
  temperature, 
  weather, 
  location, 
  humidity, 
  windSpeed, 
  description,
  aiResponse 
}) => {
  const getWeatherIcon = (weatherType: string) => {
    const weatherLower = weatherType.toLowerCase();
    if (weatherLower.includes('sun') || weatherLower.includes('clear')) {
      return '☀️';
    } else if (weatherLower.includes('cloud')) {
      return '☁️';
    } else if (weatherLower.includes('rain')) {
      return '🌧️';
    } else if (weatherLower.includes('snow')) {
      return '❄️';
    } else if (weatherLower.includes('storm')) {
      return '⛈️';
    } else if (weatherLower.includes('fog') || weatherLower.includes('mist')) {
      return '🌫️';
    } else {
      return '🌤️';
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-100 border border-blue-200 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-4xl">{getWeatherIcon(weather)}</div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{location}</h3>
            <p className="text-gray-600 capitalize">{description || weather}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-800">{temperature}°F</div>
          <div className="text-sm text-gray-600">Current</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {humidity !== undefined && (
          <div className="flex items-center gap-2 bg-white/50 rounded-lg p-3">
            <Droplets className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-sm text-gray-600">Humidity</div>
              <div className="font-semibold text-gray-800">{humidity}%</div>
            </div>
          </div>
        )}
        
        {windSpeed !== undefined && (
          <div className="flex items-center gap-2 bg-white/50 rounded-lg p-3">
            <Wind className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-sm text-gray-600">Wind Speed</div>
              <div className="font-semibold text-gray-800">{windSpeed} mph</div>
            </div>
          </div>
        )}
      </div>

      {aiResponse && (
        <div className="bg-white/70 rounded-lg p-4 border-l-4 border-blue-500">
          <div className="flex items-start gap-2">
            <CloudSun className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">AI Weather Summary</div>
              <div className="text-gray-800 leading-relaxed">{aiResponse}</div>
            </div>
          </div>
        </div>
      )}                          
    </div>
  );
};

export default Weather;


