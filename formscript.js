// Select rating spans(stars) and table body in 'twoD' section
const ratings1 = document.querySelectorAll('#twoD .ratings span');
const tableBody1 = document.querySelector('#table2D tbody');

// Select rating spans(stars) and table body in 'threeD' section
const ratings2 = document.querySelectorAll('#threeD .ratings span');
const tableBody2 = document.querySelector('#table3D tbody');

// A function to create and update the ratings table based on user's rating clicks
const createRatings = (ratings, tableBody, storageKey) => {
    //Retrieve existing or stored data from local storage.
    //Initialize if there is not data stored.
    let ratingsData = JSON.parse(localStorage.getItem(storageKey)) || [];

    //Add a click event listner to each star
    for (const rating of ratings) {
        rating.addEventListener('click', () => {
            const clickedRating = rating.getAttribute('data-rating');//Retrieve the rating value of the clicked star
            //Update the 'data-clicked' attribute of each star
            for (const r of ratings) {
                if (r.getAttribute('data-rating') <= clickedRating) {
                    r.setAttribute('data-clicked', 'true');
                } else {
                    r.removeAttribute('data-clicked');
                }
            }

            ratingsData.push({ rating: clickedRating, date: new Date().toLocaleString() });// Add new data to rating
            // Maximum 5 ratings
            if (ratingsData.length > 5) {
                ratingsData.shift();
            }
             
            localStorage.setItem(storageKey, JSON.stringify(ratingsData));// Store the updated ratings data in local storage

            generateTable(ratingsData, tableBody);// Generate table based on updated data above
        });
    }

    // A fuction to create the table.
    const generateTable = (data, body) => {
        body.innerHTML = ''; // Initialize elements within tablebody first
        for (const d of data) {
            const row = document.createElement('tr');
            const ratingCell = document.createElement('td');
            const dateCell = document.createElement('td');
    
            ratingCell.textContent = d.rating + '★';// Display the rating data in the first cell of the row with a star

            // Set the rating date in the second cell of the row
            dateCell.textContent = d.date;
            row.appendChild(ratingCell);
            row.appendChild(dateCell);
            body.appendChild(row);
        }
    }
    //Implement function  
    generateTable(ratingsData, tableBody);
}

// Call the function above with different parameters to show different tables
createRatings(ratings1, tableBody1, 'ratingsData1');
createRatings(ratings2, tableBody2, 'ratingsData2');
