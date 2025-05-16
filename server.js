const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const iconv = require("iconv-lite");
const chardet = require("chardet");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

let foodData = [];
let ingredientsData = {};

const csvFilePath = __dirname + "/Food(Upgraded).csv";
const ingredientsFilePath = __dirname + "/ingredients.json";

// Load ingredients
if (fs.existsSync(ingredientsFilePath)) {
    ingredientsData = JSON.parse(fs.readFileSync(ingredientsFilePath, "utf-8"));
    console.log("✅ Nguyên liệu đã load");
}

// Load CSV food data
if (fs.existsSync(csvFilePath)) {
    const detectedEncoding = chardet.detectFileSync(csvFilePath) || "utf-8";
    let detectedSeparator = ",";

    const tryParsing = (separator) => new Promise((resolve, reject) => {
        let testData = [];
        fs.createReadStream(csvFilePath)
            .pipe(iconv.decodeStream(detectedEncoding))
            .pipe(csv({ separator }))
            .on("data", (row) => testData.push(row))
            .on("end", () => resolve(testData.length > 0))
            .on("error", reject);
    });

    Promise.all([tryParsing(","), tryParsing(";")]).then(([commaOk, semiOk]) => {
        if (!commaOk && semiOk) detectedSeparator = ";";

        fs.createReadStream(csvFilePath)
            .pipe(iconv.decodeStream(detectedEncoding))
            .pipe(csv({ separator: detectedSeparator }))
            .on("data", (row) => {
                foodData.push({
                    name: row["Tên món ăn"]?.trim() || "",
                    energy: parseFloat(row["Năng lượng (kcal)"]) || 0,
                    protein: parseFloat(row["Protein (g)"]) || 0,
                    fat: parseFloat(row["Lipid (g)"]) || 0,
                    carbs: parseFloat(row["Glucid (g)"]) || 0,
                    fiber: parseFloat(row["Chất xơ (g)"]) || 0,
                    type: row["Loại thức ăn"]?.trim() || "Khác",
                });
            })
            .on("end", () => console.log(`✅ Đã load ${foodData.length} món ăn`));
    });
}

// ✅ API recommend nâng cấp
app.post("/recommend", (req, res) => {
    const { tdee, foodType } = req.body;
    if (!tdee || !foodType) return res.status(400).json({ error: "Thiếu dữ liệu TDEE hoặc loại món ăn" });

    const filteredFoods = foodData.filter(f => f.type.toLowerCase() === foodType.toLowerCase());
    if (!filteredFoods.length) return res.json({ meals: {} });

    const targets = { sáng: tdee * 0.3, trưa: tdee * 0.4, tối: tdee * 0.3 };
    const meals = {};

    for (const [meal, targetKcal] of Object.entries(targets)) {
        let mealFoods = [];
        let remaining = targetKcal;
        const shuffled = [...filteredFoods].sort(() => Math.random() - 0.5);

        for (let food of shuffled) {
            if (remaining <= 0) break;
            if (food.energy <= 0) continue;

            let portionFactor = Math.min(remaining / food.energy, 1); // scale nếu món lớn hơn nhu cầu còn lại
            let portionWeight = Math.round(100 * portionFactor);

            const baseIngredients = ingredientsData[food.name] || [];
            let totalBaseWeight = baseIngredients.reduce((sum, i) => sum + i.weight, 0) || 100;
            let ingredientScale = portionWeight / totalBaseWeight;

            const adjustedIngredients = baseIngredients.map(i => ({
                name: i.ingredient,
                weight: Math.round(i.weight * ingredientScale)
            }));

            mealFoods.push({
                ...food,
                weight: portionWeight,
                energy: Math.round(food.energy * portionFactor),
                protein: +(food.protein * portionFactor).toFixed(1),
                fat: +(food.fat * portionFactor).toFixed(1),
                carbs: +(food.carbs * portionFactor).toFixed(1),
                fiber: +(food.fiber * portionFactor).toFixed(1),
                ingredients: adjustedIngredients
            });

            remaining -= food.energy * portionFactor;
        }

        meals[meal] = mealFoods;
    }

    res.json({ meals });
});

// APIs phụ
app.get("/foods", (req, res) => res.json({ foodData }));
app.get("/status", (req, res) => res.json({ status: "OK", foodCount: foodData.length }));

const path = require("path");

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
