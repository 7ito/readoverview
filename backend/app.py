from flask import Flask, request, jsonify
from flask_cors import CORS
from chinese import ChineseAnalyzer
import translators as ts
import ast
import requests
import json
from ollama import Client

OLLAMA_API_URL = "http://localhost:11434"

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
    model = "deepseek-r1:1.5b"
   
    client = Client(host=OLLAMA_API_URL)
    response = client.generate(model=model, prompt=prompt)

    print(response)
    return jsonify({'response': response['response']})
    

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
            definitions_string = " / ".join(definitions)

            context_definition = ollama_request(entry['token'][0], definitions_string, input_sentence)

            item = {
                'definitions': definitions,
                'kind': entry['dict_data'][0]['kind'],
                'match': entry['dict_data'][0]['match'],
                'pinyin': entry['dict_data'][0]['pinyin'],
                'predicted_definition': context_definition
            }
            res[entry['token'][0]] = item

        translation = ts.translate_text(input_sentence, 'google', 'zh', 'en')
        
        return jsonify({'parsed': res, 'translation': translation, 'tokens': parsed.tokens(), 'raw': data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
def ollama_request(ciyu, definitions, context_sentence):
    try:
        # In the sentence {context_sentence} what is the English meaning of {ciyu}? Pick from the following English definitions: {definitions}
        prompt = f"""在句子 "{context_sentence}" 中，{ciyu} 的英语意思是什么？从下面的英文释义中选出一个：
        {definitions}    
        """

        prompt_v2 = f'从定义列表中选出句子"{context_sentence}"中{ciyu}的正确英文定义：{definitions}'
        prompt_v2_en = f'Pick the correct English definition of "{ciyu}" in the sentence "{context_sentence}", from this list of definitions: "{definitions}. Just give me the definition."'

        model = 'gemma3:12b'
       
        client = Client(host=OLLAMA_API_URL)
        response = client.generate(model=model, prompt=prompt_v2_en)

        return response['response']
    except requests.exceptions.RequestException as e:
        return f'Ollama request failed: {str(e)}'
    except Exception as e:
        return f'Internal server error {str(e)}'
