window.onload = async function () {
    const telegramID = getQueryParameter('telegram_id');
    if (telegramID) {
        try {
            const userData = await getUserData(telegramID);
            if (userData) {
                insertCustomerButtons();

                role = userData.userData.role;
                fullName = userData.userData.name;
                rate = userData.userData.rate;
                experience = userData.userData.experience;
                insertCustomerLabel(role, fullName);
            };
        } catch (error) {
            console.error(`Error in window.onload: ${error}`);
        };
    };
};


function getQueryParameter(name) {
    const urlParameters = new URLSearchParams(window.location.search);
    return urlParameters.get(name);
};


async function getUserData(telegramID) {
    try {
        const response = await fetch('/get-user-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ telegram_id: telegramID })  // Send the Telegram ID as JSON
        })
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error in getUserData: ${error}`);
        return null
    };
};


function insertCustomerLabel(role, fullName) {
    const headerNav = document.getElementById('header-nav');

    if (!headerNav) {
        console.error('Header navigation element not found');
        return;
    } else {
        const label = document.createElement('label');
        label.className = 'header-label';

        if (role === 'customer') {
            label.innerHTML = `Заказчик<br>${fullName}`;
        } else {
            label.innerHTML = `Мастер<br>${fullName}`;
        }

        headerNav.appendChild(label);
    };
};


function insertCustomerButtons() {
    const headerNav = document.getElementById('header-nav');

    if (!headerNav) {
        console.error('Header navigation element not found');
        return;
    } else {
        try {
            const createBidButton = document.createElement('button');
            createBidButton.className = 'header-button';
            createBidButton.id = 'create-bid';
            createBidButton.textContent = 'Опубликовать новый заказ 🏷️';

            const myBidsButton = document.createElement('button');
            myBidsButton.className = 'header-button';
            myBidsButton.id = 'my-bids';
            myBidsButton.textContent = 'Просмотреть мои заказы 📂';

            const lookChatsButton = document.createElement('button');
            lookChatsButton.className = 'header-button';
            lookChatsButton.id = 'look-chats';
            lookChatsButton.textContent = 'Просмотреть мои переписки с мастерами 📨';

            headerNav.appendChild(createBidButton);
            headerNav.appendChild(myBidsButton);
            headerNav.appendChild(lookChatsButton);
        } catch (error) {
            console.error(`Error in insertCustomerButtons: ${error}`);
        };
    };
};