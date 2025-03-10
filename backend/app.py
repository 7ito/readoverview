from flask import Flask, request, jsonify
from flask_cors import CORS
from chinese import ChineseAnalyzer

# venv activate command: . .venv/bin/activate
# run command: flask --app app --debug run
app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])
analyzer = ChineseAnalyzer()

@app.route("/")
def status_check():
    return "Server is running..."

@app.route("/test")
def chinese_test():
    result = analyzer.parse("我爱看书")
    result.pprint()
    return result.tokens()

@app.route('/parse', methods=['POST'])
def parse():
    data = request.json
    input_sentence = data.get('sentence', '')
    if not input_sentence:
        return jsonify({'error': 'No input provided'}), 400
    
    try: 
        result = analyzer.parse(input_sentence)
        return jsonify({'parsed': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500