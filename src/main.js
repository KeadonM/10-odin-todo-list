import './css/reset.css';
import './css/style.css';

import { getMonth, getDate, parseISO } from 'date-fns';

const ListBuilder = (listName) => {
  const list = Object.create({
    addItem: function (item) {
      this.items.push(item);
    },
    deleteItem: function (item) {
      const index = this.items.indexOf(item);
      if (index !== -1) this.items.splice(index, 1);
    },
  });

  list.title = listName;
  list.items = [];

  return list;
};

const TodoBuilder = (
  title,
  color,
  dueDate,
  priority,
  complete,
  note,
  steps
) => {
  const todo = Object.create({
    togglePriority: function () {
      this.priority = !this.priority;
    },
    toggleComplete: function () {
      this.complete = !this.complete;
    },
  });

  todo.title = title;
  todo.color = color === undefined ? 'neutral' : color;
  todo.dueDate = dueDate;
  todo.priority = priority;
  todo.complete = complete;
  todo.note = note;
  todo.steps = steps === undefined ? ListBuilder('steps') : steps;

  return todo;
};

const stepBuilder = (title, complete) => {
  const step = Object.create({
    toggleComplete: function () {
      this.complete = !this.complete;
    },
  });

  step.title = title;
  step.complete = complete === undefined ? false : complete;

  return step;
};

const masterList = (() => {
  let activeList = [];

  const setActiveList = (list) => (activeList = list);
  const getActiveList = () => activeList;

  const prepareForStorage = () => {
    const activeListIndex = masterList.items.indexOf(activeList);
    return {
      title: masterList.title,
      items: masterList.items.map((list) => {
        return {
          title: list.title,
          items: list.items.map((todo) => {
            return {
              title: todo.title,
              color: todo.color,
              dueDate: todo.dueDate,
              priority: todo.priority,
              complete: todo.complete,
              note: todo.note,
              steps: todo.steps.items.map((step) => {
                return {
                  title: step.title,
                  complete: step.complete,
                };
              }),
            };
          }),
        };
      }),
      activeListIndex,
    };
  };

  const reconstructFromStorage = (savedData) => {
    const newMasterList = ListBuilder(savedData.title);
    newMasterList.items = savedData.items.map((listData) => {
      const newList = ListBuilder(listData.title);
      newList.items = listData.items.map((todoData) => {
        const steps = ListBuilder('steps');
        steps.items = todoData.steps.map((stepData) => {
          return stepBuilder(stepData.title, stepData.complete);
        });
        return TodoBuilder(
          todoData.title,
          todoData.color,
          todoData.dueDate,
          todoData.priority,
          todoData.complete,
          todoData.note,
          steps
        );
      });
      return newList;
    });

    Object.assign(masterList, newMasterList);
    masterList.setActiveList(masterList.items[savedData.activeListIndex]);
  };

  return Object.assign(Object.create(ListBuilder('Master List')), {
    setActiveList,
    getActiveList,
    prepareForStorage,
    reconstructFromStorage,
  });
})();

const DomController = (() => {
  addList('default');

  const overlay = document.querySelector('.overlay');
  const activeTodoSidebar = document.querySelector('.active-todo-sidebar');

  const newListInput = document.querySelector('#new-list-input');
  const addTodoInput = document.querySelector('#new-todo-input');

  overlay.addEventListener('click', () => {
    closeSidebar();
  });

  newListInput.addEventListener('keydown', (e) => {
    if (!checkInputEntered(e, newListInput.value)) return;

    const title = newListInput.value;
    newListInput.value = '';

    addList(title);
    saveMasterListToLocalStorage();
  });

  addTodoInput.addEventListener('keydown', (e) => {
    if (!checkInputEntered(e, addTodoInput.value)) return;

    const title = addTodoInput.value;
    addTodoInput.value = '';

    const calenderInput = document.querySelector('.hidden-date-input');
    const calIcon = calenderInput.parentElement.querySelector('.calendar');
    const calNoGridIcon =
      calenderInput.parentElement.querySelector('.calendar-no-grid');
    calIcon.classList.add('active');
    calNoGridIcon.classList.remove('active');

    const dueDate = calenderInput.value;
    calenderInput.value = '';

    const colorSelector =
      addTodoInput.parentElement.querySelector('.color-selector');
    colorSelector.classList.add('no-selection');

    const colorInput = addTodoInput.parentElement.querySelector('.color-input');
    const color = colorInput.value === '#000000' ? 'neutral' : colorInput.value;
    colorInput.value = '';

    addTodo(title, color, dueDate);
    saveMasterListToLocalStorage();
  });

  (function setUpDateSelector() {
    const dateInputWrapper = document.querySelectorAll('.date-input-wrapper');

    dateInputWrapper.forEach((wrapper) => {
      const hiddenInput = wrapper.querySelector('.hidden-date-input');

      hiddenInput.addEventListener('change', () => {
        const calIcon = wrapper.querySelector('.calendar');
        const calNoGridIcon = wrapper.querySelector('.calendar-no-grid');

        const date = hiddenInput.value;

        const dateFormatted = parseISO(date);

        const month = getMonth(dateFormatted);
        const day = getDate(dateFormatted);

        wrapper.querySelector('.calendar-month').textContent =
          getAbbreviatedMonth(month);
        wrapper.querySelector('.calendar-day').textContent = day;

        calIcon.classList.remove('active');
        calNoGridIcon.classList.add('active');
      });
    });

    function getAbbreviatedMonth(monthIndex) {
      let abbreviatedMonth;

      switch (monthIndex) {
        case 0:
          abbreviatedMonth = 'JA';
          break;
        case 1:
          abbreviatedMonth = 'FE';
          break;
        case 2:
          abbreviatedMonth = 'MR';
          break;
        case 3:
          abbreviatedMonth = 'AL';
          break;
        case 4:
          abbreviatedMonth = 'MA';
          break;
        case 5:
          abbreviatedMonth = 'JN';
          break;
        case 6:
          abbreviatedMonth = 'JL';
          break;
        case 7:
          abbreviatedMonth = 'AU';
          break;
        case 8:
          abbreviatedMonth = 'SE';
          break;
        case 9:
          abbreviatedMonth = 'OC';
          break;
        case 10:
          abbreviatedMonth = 'NO';
          break;
        case 11:
          abbreviatedMonth = 'DE';
          break;
        default:
          abbreviatedMonth = 'Invalid month index';
      }

      return abbreviatedMonth;
    }
  })();

  (function setUpColorPicker() {
    const colorSelector = document.querySelectorAll('.color-selector');

    colorSelector.forEach((selector) => {
      const colorInput = selector.querySelector('.color-input');

      colorInput.addEventListener('change', () => {
        console.log('change');
        console.log(colorInput.value);
        colorSelector.style.backgroundColor = colorInput.value;
        colorSelector.classList.remove('no-selection');
      });

      selector.querySelectorAll('.preset').forEach((preset) => {
        preset.style.backgroundColor = preset.dataset.color;

        preset.addEventListener('click', (e) => {
          selector.blur();
          selector.style.backgroundColor = preset.dataset.color;
          selector.classList.remove('no-selection');
          colorInput.value = e.target.dataset.color;
        });
      });
    });
  })();

  function checkInputEntered(e, value) {
    if (e.key !== 'Enter' || e.keyCode !== 13) return false;
    if (value === '') return false;
    e.preventDefault();

    return true;
  }

  function saveMasterListToLocalStorage() {
    const masterListData = masterList.prepareForStorage();
    const jsonString = JSON.stringify(masterListData);
    localStorage.setItem('masterList', jsonString);
  }

  (function loadMasterListFromLocalStorage() {
    const jsonString = localStorage.getItem('masterList');

    if (jsonString) {
      const savedData = JSON.parse(jsonString);

      masterList.reconstructFromStorage(savedData);

      displayLists();
      displayTodos();
    } else {
      console.error('No saved data found in local storage');
    }
  })();

  function addList(title) {
    const newList = ListBuilder(title);
    masterList.addItem(newList);
    swapActiveList(newList);
    displayLists();
  }

  function addTodo(title, color, dueDate) {
    masterList.getActiveList().addItem(TodoBuilder(title, color, dueDate));

    displayTodos();
  }

  function swapActiveList(list) {
    masterList.setActiveList(list);

    displayTodos();
  }

  function displayLists() {
    const listContainer = document.querySelector('.list-container');
    listContainer.innerHTML = '';

    masterList.items.forEach((list) => {
      const card = buildListCard(list);
      listContainer.appendChild(card);
    });

    function buildListCard(list) {
      const card = document.createElement('div');

      const swapBtn = document.createElement('button');
      card.appendChild(swapBtn);
      swapBtn.classList.add('list-card');
      swapBtn.innerHTML = list.title;

      swapBtn.addEventListener('click', () => {
        swapActiveList(list);
      });

      const deleteBtn = document.createElement('button');
      card.appendChild(deleteBtn);
      deleteBtn.innerHTML =
        ' <i id="task-delete" class="fa-solid fa-trash"></i>';

      deleteBtn.addEventListener('click', () => {
        masterList.deleteItem(list);
        saveMasterListToLocalStorage();
      });

      return card;
    }
  }

  function displayTodos() {
    const listTitle = document.querySelector('.active-list-title');
    listTitle.textContent = masterList.getActiveList().title;

    const incompleteContainer = document.querySelector('.incomplete-container');
    incompleteContainer.innerHTML = '';

    const completeContainer = document.querySelector('.complete-container');
    completeContainer.innerHTML = '';

    masterList.getActiveList().items.forEach((todo) => {
      const card = buildTodoCard(todo);

      card.addEventListener('click', () => {
        displaySidebar(todo, card);
      });

      if (todo.complete) completeContainer.appendChild(card);
      else incompleteContainer.appendChild(card);
    });

    function buildTodoCard(todo) {
      const card = document.createElement('div');
      card.classList.add('todo-card');
      card.setAttribute('data-color', todo.color);

      const taskColor = document.createElement('style');
      taskColor.innerHTML = `[data-color="${todo.color}"]::before { background-image: linear-gradient(to right,${todo.color},rgba(0, 0, 0, 0)); }`;
      card.appendChild(taskColor);

      const checkBox = document.createElement('div');
      card.appendChild(checkBox);
      checkBox.classList.add('check-box');

      onCompletedToggled(checkBox, todo);
      checkBox.addEventListener('click', (e) => {
        e.stopPropagation();
        todo.toggleComplete();
        onCompletedToggled(checkBox, todo);
        moveTodoCard(card, todo.complete);
        saveMasterListToLocalStorage();
      });

      const title = document.createElement('h2');
      card.appendChild(title);
      title.innerHTML = todo.title;

      const dueDate = document.createElement('p');
      card.appendChild(dueDate);
      dueDate.innerHTML = todo.dueDate;

      const priority = document.createElement('div');
      card.appendChild(priority);
      onPriorityToggled(priority, todo);

      priority.addEventListener('click', (e) => {
        e.stopPropagation();
        todo.togglePriority();
        onPriorityToggled(priority, todo);
        saveMasterListToLocalStorage();
      });

      return card;
    }

    function displaySidebar(todo, card) {
      activeTodoSidebar.querySelector('#task-title').textContent = todo.title;

      displaySteps(todo);

      const addStepInput = activeTodoSidebar.querySelector('#add-step-input');
      addStepInput.value = '';
      addStepInput.addEventListener('keydown', (e) => {
        if (!checkInputEntered(e, addStepInput.value)) return;
        addStep(todo, addStepInput.value);
        addStepInput.value = '';
      });

      const dueDateLabel = activeTodoSidebar.querySelector('#task-due-date');
      dueDateLabel.textContent = todo.dueDate;

      const dateSelect = activeTodoSidebar.querySelector('#task-date-select');
      dateSelect.value = '';

      dateSelect.onchange = () => {
        todo.dueDate = dateSelect.value;
        dueDateLabel.textContent = todo.dueDate;
        saveMasterListToLocalStorage();
      };

      const note = activeTodoSidebar.querySelector('#task-note');
      note.value = '';

      if (todo.note !== undefined) note.value = todo.note;

      note.onchange = () => {
        todo.note = note.value;
        saveMasterListToLocalStorage();
      };

      const deleteBtn = activeTodoSidebar.querySelector('#task-delete');

      deleteBtn.onclick = () => {
        removeTodo(todo, card);
      };

      activeTodoSidebar.classList.add('active');
      overlay.classList.add('active');
    }

    function addStep(todo, step) {
      todo.steps.addItem(stepBuilder(step));
      saveMasterListToLocalStorage();
      displaySteps(todo);
    }

    function displaySteps(todo) {
      const stepsContainer = document.querySelector('#active-steps-container');
      stepsContainer.innerHTML = '';

      todo.steps.items.forEach((currentStep) => {
        const card = buildStepCard(currentStep);
        stepsContainer.appendChild(card);
      });

      function buildStepCard(step) {
        const stepCard = document.createElement('div');
        stepCard.classList.add('step-card');

        const checkBox = document.createElement('div');
        stepCard.appendChild(checkBox);

        onCompletedToggled(checkBox, step);
        checkBox.addEventListener('click', (e) => {
          e.stopPropagation();
          todo.toggleComplete();
          onCompletedToggled(checkBox, todo);
          saveMasterListToLocalStorage();
        });

        const stepTitle = document.createElement('p');
        stepCard.appendChild(stepTitle);
        stepTitle.textContent = step.title;

        const deleteBtn = document.createElement('p');
        stepCard.appendChild(deleteBtn);
        deleteBtn.innerHTML = '<i class="step-delete fa-solid fa-trash"></i>';

        deleteBtn.onclick = () => {
          removeStep(todo, step, stepCard, stepsContainer);
        };

        return stepCard;
      }
    }

    function onPriorityToggled(btnContainer, todo) {
      if (!todo.priority)
        btnContainer.innerHTML = '<i class="fa-regular fa-star"></i>';
      else btnContainer.innerHTML = '<i class="fa-solid fa-star"></i>';
    }

    function onCompletedToggled(btnContainer, todo) {
      if (!todo.complete)
        btnContainer.innerHTML =
          '<i class="incomplete-task fa-regular fa-circle"></i>';
      else
        btnContainer.innerHTML =
          '<i class="complete-task fa-solid fa-circle"><i class="fa-solid fa-check"></i></i>';
    }

    function moveTodoCard(card, completed) {
      if (completed) {
        incompleteContainer.removeChild(card);
        completeContainer.appendChild(card);
      } else {
        completeContainer.removeChild(card);
        incompleteContainer.appendChild(card);
      }
    }

    function removeTodo(todo, card) {
      masterList.getActiveList().deleteItem(todo);
      saveMasterListToLocalStorage();

      if (todo.complete) completeContainer.removeChild(card);
      else incompleteContainer.removeChild(card);
      closeSidebar();
    }

    function removeStep(todo, step, card, container) {
      todo.steps.deleteItem(step);
      saveMasterListToLocalStorage();

      container.removeChild(card);
    }
  }

  function closeSidebar() {
    overlay.classList.remove('active');
    activeTodoSidebar.classList.remove('active');
  }
})();
