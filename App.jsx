import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Constants
const ACTIVITY_LEVELS = {
  '1.2': 'Ít vận động',
  '1.375': 'Vận động nhẹ',
  '1.55': 'Vận động vừa',
  '1.725': 'Vận động nhiều',
  '1.9': 'Vận động rất nhiều'
};

const EXERCISE_TYPES = { /* Giữ nguyên như code gốc */ };

// Hệ số cường độ
const INTENSITY_FACTORS = { light: 0.8, medium: 1.0, high: 1.2 };

// Thực đơn mẫu
const SAMPLE_MEALS = [
  { name: "Cơm gà", calories: 500, protein: 30, carbs: 50, fat: 10 },
  { name: "Salad cá ngừ", calories: 300, protein: 25, carbs: 20, fat: 12 },
  { name: "Bò xào bông cải", calories: 400, protein: 35, carbs: 15, fat: 18 },
  { name: "Súp gà", calories: 250, protein: 20, carbs: 30, fat: 8 },
];

const CalorieCalculator = () => {
  const [personalInfo, setPersonalInfo] = useState({ 
    gender: 'male',
    age: '',
    weight: '',
    height: '',
    activityLevel: '1.2',
    goal: 'maintain',
    waist: '',
    hip: '',
    neck: ''
  });

  const [exercises, setExercises] = useState([]);
  const [results, setResults] = useState(null);
  const [dailyMenu, setDailyMenu] = useState([]);

  // Tính toán BMR
  const calculateBMR = () => {
    const { gender, age, weight, height } = personalInfo;
    return gender === 'male' 
      ? 66.47 + (13.75 * weight) + (5.003 * height) - (6.755 * age)
      : 655.1 + (9.563 * weight) + (1.850 * height) - (4.676 * age);
  };

  // Tính toán Body Fat % (Công thức US Navy)
  const calculateBodyFat = () => {
    const { waist, neck, height, gender } = personalInfo;
    if (!waist || !neck || !height) return null;
    
    const logWaistNeck = Math.log10(waist - neck);
    const logHeight = Math.log10(height);
    return gender === 'male'
      ? 86.010 * logWaistNeck - 70.041 * logHeight + 36.76
      : 163.205 * logWaistNeck - 97.684 * logHeight - 78.387;
  };

  // Tạo thực đơn tự động
  const generateMenu = (targetCalories) => {
    let remainingCalories = targetCalories;
    const menu = [];
    
    while (remainingCalories > 0) {
      const meal = SAMPLE_MEALS[Math.floor(Math.random() * SAMPLE_MEALS.length)];
      if (meal.calories <= remainingCalories) {
        menu.push(meal);
        remainingCalories -= meal.calories;
      }
    }
    setDailyMenu(menu);
  };

  // Xử lý tính toán chính
  const handleCalculate = () => {
    // Validate dữ liệu
    if (!personalInfo.age || !personalInfo.weight || !personalInfo.height) {
      alert("Vui lòng nhập đủ thông tin cơ bản!");
      return;
    }

    const bmr = calculateBMR();
    const bmi = personalInfo.weight / ((personalInfo.height / 100) ** 2);
    const bodyFat = calculateBodyFat();
    const whr = personalInfo.waist / personalInfo.hip;

    // Tính TDEE
    let tdee = bmr * parseFloat(personalInfo.activityLevel);
    tdee += exercises.reduce((total, exercise) => {
      const activity = Object.values(EXERCISE_TYPES)
        .flatMap(type => type.activities)
        .find(a => a.id === exercise.type);
      if (!activity) return total;

      const met = activity.metValue * INTENSITY_FACTORS[exercise.intensity];
      return total + (met * personalInfo.weight * (exercise.duration / 60) * exercise.frequency;
    }, 0);

    // Target calories
    let targetCalories = tdee;
    if (personalInfo.goal === 'lose') targetCalories -= 500;
    if (personalInfo.goal === 'gain') targetCalories += 500;

    // Cập nhật kết quả
    setResults({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      targetCalories: Math.round(targetCalories),
      bmi: bmi.toFixed(1),
      bodyFat: bodyFat?.toFixed(1),
      whr: whr.toFixed(2),
      warnings: {
        lowCalorie: targetCalories < bmr,
        highWHR: whr > 0.9
      }
    });

    // Tạo thực đơn
    generateMenu(targetCalories);
  };

  // Phần JSX (UI) giữ nguyên như code gốc, thêm phần hiển thị kết quả:
  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Các tabs nhập liệu giữ nguyên */}

      {/* Phần hiển thị kết quả */}
      {results && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Kết Quả & Khuyến Nghị</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-bold">Chỉ Số Cơ Bản:</h3>
                <p>BMR: {results.bmr} kcal</p>
                <p>TDEE: {results.tdee} kcal</p>
                <p>Mục Tiêu Calo: {results.targetCalories} kcal</p>
                <p>BMI: {results.bmi} ({results.bmi < 18.5 ? 'Thiếu cân' : results.bmi < 23 ? 'Bình thường' : 'Thừa cân'})</p>
                {results.bodyFat && <p>Body Fat: {results.bodyFat}%</p>}
                {results.whr && <p>WHR: {results.whr} {results.whr > 0.9 && '(Nguy cơ tim mạch cao)'}</p>}
              </div>

              <div>
                <h3 className="font-bold">Thực Đơn Gợi Ý:</h3>
                {dailyMenu.map((meal, index) => (
                  <div key={index} className="mb-2 p-2 bg-gray-100 rounded">
                    <p>{meal.name} - {meal.calories} kcal</p>
                    <p className="text-sm">Protein: {meal.protein}g | Carb: {meal.carbs}g | Fat: {meal.fat}g</p>
                  </div>
                ))}
              </div>
            </div>

            {results.warnings.lowCalorie && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>
                  ⚠️ Cảnh báo: Lượng calo mục tiêu thấp hơn BMR! Cần điều chỉnh lại mục tiêu.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};