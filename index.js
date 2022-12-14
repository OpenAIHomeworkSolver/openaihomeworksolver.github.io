document.querySelector('input[type="file"]').addEventListener('change', e => {
    processImage(e.target.files[0]);
});

async function processImage(image) {
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
                    'Authorization': 'Bearer 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'
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