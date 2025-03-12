from flask import Flask, request, jsonify
from flask_cors import CORS
from chinese import ChineseAnalyzer
import translators as ts
import ast

# venv activate command: . .venv/bin/activate
# run command: flask --app app --debug run
app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])
analyzer = ChineseAnalyzer()

@app.route("/")
def status_check():
    return "Server is running..."

# TODO: Check if input text is Chinese and return error if not
# res not being ordered is solved by looping through tokens array and using each token as dict key
@app.route('/parse', methods=['POST'])
def parse():
    data = request.json
    input_sentence = data.get('sentence', '')
    if not input_sentence:
        return jsonify({'error': 'No input provided'}), 400

    # Check if input is Chinese
    try: 
        parsed = analyzer.parse(input_sentence)

        data = ast.literal_eval(parsed.pformat())
        res = {}
        for entry in data['parsed']:
            item = {
                'definitions': entry['dict_data'][0]['definitions'],
                'kind': entry['dict_data'][0]['kind'],
                'match': entry['dict_data'][0]['match'],
                'pinyin': entry['dict_data'][0]['pinyin']
            }
            res[entry['token'][0]] = item

        translation = ts.translate_text(input_sentence, 'google', 'zh', 'en')

        return jsonify({'parsed': res, 'translation': translation, 'tokens': parsed.tokens(), 'raw': data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500