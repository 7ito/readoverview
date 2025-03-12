from flask import Flask, request, jsonify
from flask_cors import CORS
from chinese import ChineseAnalyzer
import translators as ts
import ast
import requests
import json

OLLAMA_API_URL = "http://localhost:11434/api/generate"

# venv activate command: . .venv/bin/activate
# run command: flask --app app --debug run
app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])
analyzer = ChineseAnalyzer()

@app.route("/")
def status_check():
    return "Server is running..."

@app.route('/ollama_test', methods=['POST'])
def ollama_test():
    data = request.json
    prompt = data.get('prompt')
    model = "deepseek-r1:1b"
    
    response = requests.post(
        OLLAMA_API_URL,
        json={
            'model': model,
            'prompt': prompt,
        }
    )
    print(response)
    response_json = json.loads(response)
    return jsonify({'response': response_json})
    

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
            definitions = entry['dict_data'][0]['definitions']
            definitions_string = ""
            for definition in definitions:
                defintions_string = definitions_string + definition + "\n"

            #context_definition = ollama_request(entry['token'][0], definitions_string, input_sentence)

            item = {
                'definitions': definitions,
                'kind': entry['dict_data'][0]['kind'],
                'match': entry['dict_data'][0]['match'],
                'pinyin': entry['dict_data'][0]['pinyin'],
                #'predicted_definition': context_definition
            }
            res[entry['token'][0]] = item

        translation = ts.translate_text(input_sentence, 'google', 'zh', 'en')
        
        return jsonify({'parsed': res, 'translation': translation, 'tokens': parsed.tokens(), 'raw': data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
def ollama_request(ciyu, definitions, context_sentence):
    # In the sentence {context_sentence} what is the English meaning of {ciyu}? Pick from the following English definitions: {definitions}
    prompt = f"""在句子 "{context_sentence}" 中，{ciyu} 的英语意思是什么？从下面的英文释义中选出一个：
    {definitions}    
    """

    model = 'deepseek-r1:14b'

    try:
        response = requests.post(
            OLLAMA_API_URL,
            json={
                'model': model,
                'prompt': prompt,
                'stream': False,
                'options': {
                    'temperature': 0.9
                }
            }
        )
        print(response)
        response_json = json.loads(response.response)
        print(response_json)

        return jsonify({'response': response_json})

    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Ollama request failed: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Internal server error {str(e)}'}), 500
