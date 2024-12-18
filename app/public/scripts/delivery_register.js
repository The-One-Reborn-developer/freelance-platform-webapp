window.Telegram.WebApp.disableVerticalSwipes()

const customerButton = document.getElementById('customer-button');
const courierButton = document.getElementById('courier-button');
const registerButton = document.getElementById('register-button');
const nameInput = document.getElementById('name-input');
const nameLabel = document.getElementById('name-label');
const dateOfBirthInput = document.getElementById('date-of-birth-input');
const dateOfBirthLabel = document.getElementById('date-of-birth-label');
const hasCarContainer = document.getElementById('has-car-container');
const hasCarInputTrue = document.getElementById('has-car-input-true');
const hasCarInputFalse = document.getElementById('has-car-input-false');
const hasCarLabel = document.getElementById('has-car-label');
const carModelInput = document.getElementById('car-model-input');
const carModelLabel = document.getElementById('car-model-label');
const carDimensionsContainer = document.getElementById('car-dimensions-container');
const carDimensionsWidthInput = document.getElementById('car-dimensions-width-input');
const carDimensionsLengthInput = document.getElementById('car-dimensions-length-input');
const carDimensionsHeightInput = document.getElementById('car-dimensions-height-input');
const carDimensionsLabel = document.getElementById('car-dimensions-label');

customerButton.addEventListener('click', chooseCustomer);
courierButton.addEventListener('click', chooseCourier);
registerButton.addEventListener('click', register);


function initializePage() {
    nameInput.style.display = 'none';
    nameLabel.style.display = 'none';
    dateOfBirthInput.style.display = 'none';
    dateOfBirthLabel.style.display = 'none';
    hasCarContainer.style.display = 'none';
    hasCarLabel.style.display = 'none';
    carModelInput.style.display = 'none';
    carModelLabel.style.display = 'none';
    carDimensionsContainer.style.display = 'none';
    carDimensionsLabel.style.display = 'none';
    registerButton.style.display = 'none';
};


window.onload = function () {
    initializePage();

    // Check if the user is already registered
    const telegramData = window.Telegram.WebApp.initData;
    checkIfUserIsRegistered(telegramData);

    // Ensure that the keyboard is closed when the user touches the screen outside of input elements
    document.addEventListener('touchstart', (event) => {
        if (!event.target.closest('input, textarea, select')) {
            document.activeElement.blur();
        };
    });    
};


function checkIfUserIsRegistered(telegramData) {
    fetch('/check-registration', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ service: 'delivery', telegram_data: telegramData })  // Send the Telegram data as JSON
    })
    .then(response => response.json())
    .then(data => {
        if (data.registered) {
            console.log(data);
            window.location.href = `main.html?telegram_id=${encodeURIComponent(data.telegram_id)}`;  // Redirect if the user is registered
        };
    })
    .catch(error => {
        console.error(`Error in checkIfUserIsRegistered: ${error}`);
    });
};


function chooseCustomer() {
    // Show only the name input and label
    nameInput.style.display = '';
    nameLabel.style.display = '';
    dateOfBirthInput.style.display = 'none';
    dateOfBirthLabel.style.display = 'none';
    hasCarContainer.style.display = 'none';
    hasCarLabel.style.display = 'none';
    carModelInput.style.display = 'none';
    carModelLabel.style.display = 'none';
    carDimensionsContainer.style.display = 'none';
    carDimensionsLabel.style.display = 'none';
    registerButton.style.display = '';

    // Highlight the selected button
    customerButton.style.backgroundColor = 'darkgrey';
    courierButton.style.backgroundColor = '';
};


function chooseCourier() {
    // Show name, rate, and experience inputs and labels
    nameInput.style.display = '';
    nameLabel.style.display = '';
    dateOfBirthInput.style.display = '';
    dateOfBirthLabel.style.display = '';
    hasCarContainer.style.display = '';
    hasCarLabel.style.display = '';
    carModelInput.style.display = '';
    carModelLabel.style.display = '';
    carDimensionsContainer.style.display = '';
    carDimensionsLabel.style.display = '';
    registerButton.style.display = '';

    // Highlight the selected button
    courierButton.style.backgroundColor = 'darkgrey';
    customerButton.style.backgroundColor = '';
};


function register() {
    const role = customerButton.style.backgroundColor === 'darkgrey' ? 'customer' : 'performer';
    const name = nameInput.value.trim();
    const dateOfBirth = dateOfBirthInput.value.trim();
    const hasCar = hasCarInputTrue.checked;
    const carModel = carModelInput.value.trim();
    const carDimensionsWidth = carDimensionsWidthInput.value.trim();
    const carDimensionsLength = carDimensionsLengthInput.value.trim();
    const carDimensionsHeight = carDimensionsHeightInput.value.trim();
    const telegramData = window.Telegram.WebApp.initData;

    if (!name || (role === 'courier' && (!dateOfBirth || !hasCar))) {
        showModal('Пожалуйста, заполните все необходимые поля.');
        return;
    } else if (role === 'courier' && hasCar && (!carModel || !carDimensionsWidth || !carDimensionsLength || !carDimensionsHeight)) {
        showModal('Пожалуйста, заполните все необходимые поля.');
        return;
    } else {
        const data = {
            role,
            name,
            date_of_birth: dateOfBirth,
            has_car: hasCar,
            car_model: carModel,
            car_dimensions_width: carDimensionsWidth,
            car_dimensions_length: carDimensionsLength,
            car_dimensions_height: carDimensionsHeight,
            telegram_data: telegramData,
            service: 'delivery'
        };
        
        fetch('/registration-attempt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Registration is successful
                showModal(data.message, true, data.telegram_id);
            } else {
                // Registration failed
                showModal(data.message, false, null);
            };
        })
        .catch(error => {
            console.error('Error:', error);
        });
    };
};


function showModal(message, isSuccess, telegramID) {
    const modal = document.getElementById('registration-modal');
    const modalOkButton = document.getElementById('modal-button');
    const modalMessage = document.getElementById('modal-message');

    modal.style.visibility = 'visible';
    modalMessage.textContent = message;

    modalOkButton.onclick = () => {
        modal.style.visibility = 'hidden';

        // If registration is successful, redirect
        if (isSuccess) {
            window.location.href = `delivery_main.html?telegram_id=${encodeURIComponent(telegramID)}`;  // Redirect if the user is registered
        };
    };
};


// Ensure the input field is scrolled into view
const inputs = document.querySelectorAll('input, textarea');
inputs.forEach((input) => {
    input.addEventListener('focus', () => {
        setTimeout(() => {
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    });
});