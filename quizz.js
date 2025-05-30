document.addEventListener("DOMContentLoaded", () => {
  const startScreen = document.getElementById("start-screen");
  const mainContainer = document.getElementById("main-container");
  const quizzContent = document.getElementById("quizz-content");
  const startButton = document.getElementById("start-button");
  const nextButton = document.getElementById("next");
  const previousButton = document.getElementById("previous");
  const submitButton = document.getElementById("submit");
  const resultsContainer = document.getElementById("results");
  const reminderBlock = document.getElementById("review-reminder");
  const progressText = document.getElementById("question-progress");
  const subjectSection = document.getElementById("subject-section");
  const levelSection = document.getElementById("level-section");
  const levelSections = {
    Collège: document.querySelector("#collège-levels .flex"),
    Lycée: document.querySelector("#lycée-levels .flex"),
    Prépa: document.querySelector("#prépa-levels .flex"),
  };
  const levelWrapper = document.getElementById('level-container-wrapper');
  const scrollAnchor = document.getElementById('scroll-anchor');

  function animateCollapse(wrapper, target) {
    currentHeight = wrapper.scrollHeight;
    console.log('animateCollapse called ' + wrapper.id + ' ----- from ' + currentHeight + ' to ' + target);
    wrapper.style.maxHeight = currentHeight + 'px';
    void wrapper.offsetHeight;
    requestAnimationFrame(() => {
      wrapper.style.maxHeight = target;
    })
  }

  function animateExpand(wrapper) {
    currentHeight = wrapper.scrollHeight;
    wrapper.style.maxHeight = currentHeight + 'px';
    void wrapper.offsetHeight;
    console.log('animateCollapse called ' + wrapper.id + ' ----- from ' + currentHeight + ' to ' + currentHeight);
    requestAnimationFrame(() => {
      wrapper.style.maxHeight = wrapper.scrollHeight + 'px';
    });
    
  }

  function loadLevels(subject) {
    return fetch(`get_levels.php?subject=${encodeURIComponent(subject)}`)
      .then(res => res.json())
      .then(levels => {
        levels.forEach(filename => {
          const match = filename.match(/^([^-]+)-\s(\d)\s-\s(.+)$/);
          //const match = filename.match(/^([^-]+)\s*-\s*(.+)$/);
          if (!match) return;
          const level = match[1].trim();
          const sublevel = match[3].trim();
          //const sublevel = match[2].trim();

          const section = levelSections[level];
          if (!section) return;

          const btn = document.createElement('button');
          btn.textContent = sublevel;
          btn.className = 'hover:bg-blue-600 mt-6 px-6 py-3 bg-gray-400 text-white font-bold rounded-lg w-11/12 max-w-xs mx-auto sm:w-28 sm:mx-2';
          btn.addEventListener('click', () => {
            selectedLevel = filename;

            levelSection.querySelectorAll('button').forEach(btn => {
               btn.classList.remove('bg-blue-500');
               btn.classList.add('bg-gray-400');
            });

            btn.classList.remove('bg-gray-400');
            btn.classList.add('bg-blue-500');

            startButton.disabled = false;
            startButton.classList.remove('hidden');
            requestAnimationFrame(() => {
              animateExpand(levelWrapper);
            });

            setTimeout(() => {
              if (startButton && window.innerWidth < 768) {
                scrollAnchor.scrollIntoView({ behavior: 'smooth', block: 'end' });
              }
            }, 250);
          });
          section.appendChild(btn);
        });
      });
  }

  function buildQuizz() {
    const output = [];

    window.quizzData.forEach((currentQuestion, questionNumber) => {
      const answers = [];

      for (const letter in currentQuestion.answers) {
        answers.push(
          `<label class="block mb-2 p-3 border rounded-lg hover:bg-gray-100">
            <input type="radio" name="question${questionNumber}" value="${letter}" class="mr-2">
            <span>${currentQuestion.answers[letter]}</span>
          </label>`
        );
      }

      output.push(
        `<div class="slide ${questionNumber === 0 ? '' : 'hidden'} space-y-4">
          <div class="text-lg font-semibold">${currentQuestion.question}</div>
          <div class="answers">${answers.join('')}</div>
          <div class="explanation mt-4 p-4 border-l-4 border-blue-400 bg-blue-50 hidden text-sm rounded">${currentQuestion.explanation}</div>
        </div>`
      );
    });

    quizzContent.innerHTML = output.join('');
    slides = document.querySelectorAll(".slide");

    slides.forEach((slide, index) => {
      const radios = slide.querySelectorAll("input[type=radio]");
      radios.forEach(radio => {
        radio.addEventListener("change", () => {
          if (index === slides.length - 1) {
            submitButton.disabled = false;
          } else {
            nextButton.disabled = false;
          }
        });
      });
    });

    submitButton.addEventListener("click", showResults);
    previousButton.addEventListener("click", showPreviousSlide);
    nextButton.addEventListener("click", showNextSlide);
    nextButton.classList.remove("hidden");
    nextButton.disabled = true;
    progressText.textContent = `Question 1 sur ${window.quizzData.length}`
    
    currentSlide = 0
    showSlide(currentSlide);

  }

  function showSlide(n) {
    nextSlide = slides[n];
    prevSlide = slides[currentSlide];

    if (!quizzStart) {
      requestAnimationFrame(() => {
          animateCollapse(mainContainer, "4.5em");
        });
    }

    const onTransitionEnd = () => {
      mainContainer.removeEventListener('transitionend', onTransitionEnd);

      prevSlide.classList.add('hidden');
      void mainContainer.offsetHeight;
      nextSlide.classList.remove('hidden');
      requestAnimationFrame(() => {
        animateExpand(mainContainer);
      });

      previousButton.classList.toggle("invisible", currentSlide === 0);
      nextButton.classList.toggle("hidden", currentSlide === slides.length - 1);
      submitButton.classList.toggle("hidden", finished || currentSlide !== slides.length - 1);

    };

    mainContainer.addEventListener('transitionend', onTransitionEnd, { once: true });    

    nextButton.disabled = true;
    submitButton.disabled = true;

    currentSlide = n;
    const currentInputs = slides[currentSlide].querySelectorAll("input[type=radio]");
    const answered = Array.from(currentInputs).some(input => input.checked);

    if (answered) {
      if (currentSlide === slides.length - 1) {
        submitButton.disabled = false;
      } else {
        nextButton.disabled = false;
      }
    }

    progressText.textContent = `Question ${currentSlide + 1} sur ${window.quizzData.length}`;
    if (quizzStart) quizzStart = false;

    MathJax.typeset()

  }

  function showNextSlide() {
    if (currentSlide < slides.length - 1) showSlide(currentSlide + 1);
  }

  function showPreviousSlide() {
    if (currentSlide > 0) showSlide(currentSlide - 1);
  }

  function showResults() {
    const answerContainers = quizzContent.querySelectorAll('.answers');
    let numCorrect = 0;

    window.quizzData.forEach((currentQuestion, questionNumber) => {
      const answerContainer = answerContainers[questionNumber];
      const selector = `input[name=question${questionNumber}]:checked`;
      const userAnswer = (answerContainer.querySelector(selector) || {}).value;

      const labels = answerContainer.querySelectorAll("label");
      labels.forEach(label => {
        const input = label.querySelector("input");
        input.disabled = true;
        if (input.value === currentQuestion.correctAnswer) {
          label.classList.add("bg-green-100", "border-green-400");
        } else if (input.checked) {
          label.classList.add("bg-red-100", "border-red-400");
        }
      });

      const explanationBlock = slides[questionNumber].querySelector(".explanation");
      explanationBlock.classList.remove("hidden");

      if (userAnswer === currentQuestion.correctAnswer) {
        numCorrect++;
      }

      if (numCorrect < window.quizzData.length) {
        if (reminderBlock) {
          reminderBlock.textContent = 'Vous pouvez revenir sur les questions où vous avez fait une erreur en utilisant le bouton "Précédent".';
          reminderBlock.classList.remove("hidden");
        }
      }

    });

    const reponseLabel = (numCorrect === 1 || numCorrect === 0) ? "réponse" : "réponses";
    const correcteLabel = (numCorrect === 1 || numCorrect === 0) ? "correcte" : "correctes";

    if (numCorrect === window.quizzData.length) resultsContainer.innerHTML = '🥳 ';
    resultsContainer.innerHTML += `Vous avez ${numCorrect} ${reponseLabel} ${correcteLabel} sur ${window.quizzData.length}`;
    if (numCorrect === window.quizzData.length) resultsContainer.innerHTML += ' 🥳';
    resultsContainer.classList.remove("hidden");
    submitButton.classList.add("hidden");
    finished = true;

    animateExpand(mainContainer);

    fetch('submit.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subject: selectedSubject,
        level: selectedLevel,
        score: numCorrect
      })
    });


  }

  let selectedSubject = null;
  let selectedLevel = null;
  finished = false;
  quizzStart = true;
  initialTransitionFired = false;

  document.querySelectorAll('.subject-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      console.log('subject button clicked');
      document.querySelectorAll('.subject-btn').forEach(b => {
        b.classList.remove('ring-2', 'ring-blue-400', 'bg-blue-100');
      });

      btn.classList.add('ring-2', 'ring-blue-400', 'bg-blue-100');

      selectedSubject = btn.getAttribute('data-subject');
      selectedLevel = null;

      startButton.disabled = true;
      
      requestAnimationFrame(() => {
        console.log('requestAnimationFrame called #1');
        animateCollapse(levelWrapper, "0px");
      });

      const onTransitionEnd = () => {
        initialTransitionFired = true;
        console.log('onTransitionEnd called #1');
        levelWrapper.removeEventListener('transitionend', onTransitionEnd);

        levelSection.querySelectorAll('.flex').forEach(div => {
          div.innerHTML = '';
        });

        startButton.classList.add('hidden');
  
        loadLevels(selectedSubject).then(() => {
          requestAnimationFrame(() => {
            console.log('requestAnimationFrame called #2');
            animateExpand(levelWrapper);
          });
        });
      };
    levelWrapper.addEventListener('transitionend', onTransitionEnd, { once: true });

    // dirty hack to make the first expand work on Chromium-based browsers (thanks ChatGPT!)
    setTimeout(() => {
      if (!initialTransitionFired) {
        levelWrapper.removeEventListener('transitionend', onTransitionEnd);

        levelSection.querySelectorAll('.flex').forEach(div => {
          div.innerHTML = '';
        });

        startButton.classList.add('hidden');
  
        loadLevels(selectedSubject).then(() => {
          requestAnimationFrame(() => {
            animateExpand(levelWrapper);
          });
        });
      }

    }, 100); 


    });
  });

  let currentSlide = 0;
  let slides = [];

  startButton.addEventListener("click", () => {
    const subject = selectedSubject;
    const level = selectedLevel;

    fetch(`data/${subject}/${level}.json`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
          }
          return res.json();
      })
      .then(data => {
        window.quizzData = data;
        if (!window.quizzData) throw new Error('Error loading JSON quizz data!');
        
        startScreen.classList.add('opacity-0', 'translate-y-4');
        startScreen.classList.add('transition-all', 'duration-500', 'ease-in-out');

        startScreen.addEventListener('transitionend', () => {
          startScreen.classList.add('hidden');

          void mainContainer.offsetHeight;
          mainContainer.classList.remove('hidden');

          setTimeout(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                mainContainer.classList.remove('opacity-0', 'translate-y-4');
              });
            });
          }, 100);
          buildQuizz();
        }, { once: true });
      })
      .catch(error => {
         console.log(error);
         alert('Impossible de charger les données du quizz !');
      });

  });

});