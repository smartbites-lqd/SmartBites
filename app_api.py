
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv
from PIL import Image
import io

load_dotenv()
genai.configure(api_key="AIzaSyB5gIQF-K0_wLgCoeUYIuowoY694nuZjX4")

app = Flask(__name__)
CORS(app)

input_prompt = """
    S_MBi-AI mến chào bạn dùng!. Hãy phân tích các món ăn có trong hình ảnh và cung cấp thông tin chi tiết. Vui lòng liệt kê các loại thực phẩm có trong ảnh cùng với lượng calo ước tính tương ứng. Ngoài ra, hãy viết phần tóm tắt về món ăn và độ tuổi phù hợp để tiêu thụ toàn bộ món ăn này.

Ví dụ:
1. Tên món ăn - Số calo
2. Tên món ăn - Số calo
3. ...

Tổng lượng calo: [tổng lượng calo]

Tóm tắt:
[Tóm tóm các món ăn]

Độ tuổi phù hợp:
[Độ tuổi phù hợp để tiêu thụ món ăn]
"""

def get_model_response(input, image):
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content([input, image])
    return response.text

@app.route('/analyze', methods=['POST'])
def analyze_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    file = request.files['image']
    image = Image.open(file.stream)

    try:
        result = get_model_response(input_prompt, image)
        return jsonify({'result': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get('message', '')
    if not user_message:
        return jsonify({'error': 'No message provided'}), 400

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(user_message)
        return jsonify({'response': response.text})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
