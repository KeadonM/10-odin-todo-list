import './css/reset.css';
import './css/style.css';

const ListBuilder = (listName) => {
  const list = Object.create({
    addItem: function (item) {
      this.items.push(item);
    },
  });

  list.title = listName;
  list.items = [];

  return list;
};

const TodoBuilder = (title, description, dueDate, priority) => {
  const todo = Object.create({
    togglePriority: function () {
      this.priority = !this.priority;
    },
  });

  todo.title = title;
  todo.description = description;
  todo.dueDate = dueDate;
  todo.priority = priority;

  return todo;
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
              description: todo.description,
              dueDate: todo.dueDate,
              priority: todo.priority,
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
        return TodoBuilder(
          todoData.title,
          todoData.description,
          todoData.dueDate,
          todoData.priority
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

  const newListBtn = document.querySelector('.create-list-btn');
  const addTodoBtn = document.querySelector('.add-todo-btn');
  const saveBtn = document.querySelector('.save-btn');
  const loadBtn = document.querySelector('.load-btn');

  newListBtn.addEventListener('click', () => {
    const input = document.querySelector('#new-list-input');
    const title = input.value === '' ? 'default' : input.value;
    input.value = '';

    addList(title);
  });

  addTodoBtn.addEventListener('click', () => {
    const input = document.querySelector('#new-todo-input');
    const title = input.value === '' ? 'default' : input.value;
    input.value = '';

    addTodo(title);
  });

  saveBtn.addEventListener('click', () => {
    saveMasterListToLocalStorage();
  });

  loadBtn.addEventListener('click', () => {
    loadMasterListFromLocalStorage();
  });

  function saveMasterListToLocalStorage() {
    const masterListData = masterList.prepareForStorage();
    const jsonString = JSON.stringify(masterListData);
    localStorage.setItem('masterList', jsonString);
  }

  function loadMasterListFromLocalStorage() {
    const jsonString = localStorage.getItem('masterList');

    if (jsonString) {
      const savedData = JSON.parse(jsonString);

      masterList.reconstructFromStorage(savedData);

      displayLists();
      displayTodos();
    } else {
      console.error('No saved data found in local storage');
    }
  }

  function addList(title) {
    const newList = ListBuilder(title);
    masterList.addItem(newList);
    swapActiveList(newList);
    displayLists();
  }

  function addTodo(title) {
    masterList
      .getActiveList()
      .addItem(TodoBuilder(title, 'default', 'default', false));

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
      const card = document.createElement('button');
      card.classList.add('list-card');
      card.innerHTML = list.title;

      card.addEventListener('click', () => {
        swapActiveList(list);
      });

      return card;
    }
  }

  function displayTodos() {
    const listTitle = document.querySelector('.active-list-title');
    listTitle.textContent = masterList.getActiveList().title;

    const container = document.querySelector('.todo-container');
    container.innerHTML = '';

    masterList.getActiveList().items.forEach((todo) => {
      const card = buildTodoCard(todo);
      container.appendChild(card);
    });

    function buildTodoCard(todo) {
      const card = document.createElement('div');
      card.classList.add('todo-card');

      const title = document.createElement('h2');
      card.appendChild(title);
      title.innerHTML = todo.title;

      const description = document.createElement('p');
      card.appendChild(description);
      description.innerHTML = todo.description;

      const dueDate = document.createElement('p');
      card.appendChild(dueDate);
      dueDate.innerHTML = todo.dueDate;

      const priority = document.createElement('p');
      card.appendChild(priority);
      priority.innerHTML = todo.priority;

      return card;
    }
  }
})();
