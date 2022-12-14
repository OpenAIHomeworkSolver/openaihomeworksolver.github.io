document.getElementById("key-input").value = getCookie('OpenAIBearer');

document.getElementById('image-input').addEventListener('change', e => {
    processImage(e.target.files[0]);
});

document.getElementById('key-submit').addEventListener('click', e => {
    setKeyCookie();

    document.getElementById('image-input').value = null;
    document.getElementById("error").hidden = true;
});

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function setKeyCookie() {
    const token = document.querySelector('#key-input').value;
    document.cookie = "OpenAIBearer=" + token;
}

async function processImage(image) {
    setKeyCookie()
    document.getElementById("error").hidden = true;
    Tesseract.recognize(
        image, "eng"
    ).then(async ({data: {text}}) => {
        const questions = text.split(/[.?](\r\n|\n|\r)(\r\n|\n|\r)/gm);

        const filteredQuestions = []

        for (let i = 0; i < questions.length; i++) {
            const question = questions[i].replace(/\n/g, " ");
            if (question.length < 5) {
                continue;
            }
            if (!/[1234567890]\./.test(question) && !question.includes("?")) {
                continue;
            }

            filteredQuestions.push(question)
        }

        for (let i = 0; i < filteredQuestions.length; i++) {
            let question = filteredQuestions[i].replace(/\n/g, " ") + "?";
            let originalQuestion = question;

            if (/[A-Za-z]/.test(question[0])) {
                console.log(question[0].toLowerCase().charCodeAt(0) - 96)
                console.log(i - (question[0].toLowerCase().charCodeAt(0) - 96))
                let context = filteredQuestions[i - (question[0].toLowerCase().charCodeAt(0) - 96)]

                question = context + question;
            }

            let response = await fetch('https://api.openai.com/v1/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': "Bearer " + getCookie('OpenAIBearer')
                },
                body: JSON.stringify({
                    'model': 'text-davinci-003',
                    'prompt': question,
                    'temperature': 0.7,
                    'max_tokens': 2048,
                    'top_p': 1,
                    'frequency_penalty': 0,
                    'presence_penalty': 0
                })
            });
            let responseJson = await response.json();

            if (JSON.stringify(responseJson).includes("Incorrect API key provided")) {
                document.getElementById("error").hidden = false;
                return
            }

            console.log(question + ": " + responseJson['choices'][0]['text']);

            const element = document.getElementById("new");
            const tag = document.createElement("p");
            tag.appendChild(element.appendChild(document.createTextNode(originalQuestion)));
            tag.appendChild(element.appendChild(document.createElement("br")));
            tag.appendChild(element.appendChild(document.createTextNode("\u2003" + responseJson['choices'][0]['text'])));
            element.appendChild(tag);
        }
    })
}