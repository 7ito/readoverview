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
        parsed = analyzer.parse(input_sentence)
        print(parsed.pformat())
        return jsonify({'parsed': parsed.pformat()})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
# {'我': [
#     {
#         'definitions': ['I', 'me', 'my'],
#         'kind': 'Simplified',
#         'match': '我',    
#         'pinyin': ['wo3']
#     }
# ],
# '爱': [{'definitions': ['to love',
#                        'to be fond of',
#                        'to like',
#                        'affection',
#                        'to be inclined (to do sth)',
#                        'to tend to (happen)'],
#        'kind': 'Simplified',
#        'match': '愛',
#        'pinyin': ['ai4']}],
# '看书': [{'definitions': ['to read', 'to study'],
#         'kind': 'Simplified',
#         'match': '看書',
#         'pinyin': ['kan4', 'shu1']}]}
