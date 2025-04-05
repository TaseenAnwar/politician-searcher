document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Search section
    const searchSection = document.getElementById('search-section');
    const searchForm = document.getElementById('search-form');
    const politicianName = document.getElementById('politician-name');
    const politicianState = document.getElementById('politician-state');
    const additionalInfo = document.getElementById('additional-info');
    const loading = document.getElementById('loading');
    const politicianResult = document.getElementById('politician-result');
    const resultPhoto = document.getElementById('result-photo');
    const resultName = document.getElementById('result-name');
    const resultTitle = document.getElementById('result-title');
    const confirmButton = document.getElementById('confirm-politician');
    const refineButton = document.getElementById('refine-search');
    const refineSearchSection = document.getElementById('refine-search-section');
    const refineForm = document.getElementById('refine-form');
    const refineInfo = document.getElementById('refine-info');

    // DOM Elements - Detail section
    const detailSection = document.getElementById('detail-section');
    const detailLoading = document.getElementById('detail-loading');
    const detailPhoto = document.getElementById('detail-photo');
    const detailName = document.getElementById('detail-name');
    const detailPosition = document.getElementById('detail-position');
    const detailState = document.getElementById('detail-state');
    const detailAge = document.getElementById('detail-age');
    const bioContent = document.getElementById('bio-content');
    const donationsContent = document.getElementById('donations-content');
    const israelDonationsContent = document.getElementById('israel-donations-content');
    const newsContent = document.getElementById('news-content');
    const tweetsContent = document.getElementById('tweets-content');
    const backToSearchButton = document.getElementById('back-to-search');

    // Store current politician data
    let currentPolitician = null;

    // Handle initial search form submission
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show loading spinner
        searchForm.classList.add('hidden');
        loading.classList.remove('hidden');
        politicianResult.classList.add('hidden');
        refineSearchSection.classList.add('hidden');
        
        try {
            const response = await fetch('/api/search-politician', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: politicianName.value,
                    state: politicianState.value,
                    additionalInfo: additionalInfo.value
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                currentPolitician = data.politician;
                
                // Display the result
                resultPhoto.src = currentPolitician.photoUrl;
                resultName.textContent = currentPolitician.name;
                resultTitle.textContent = currentPolitician.title;
                
                // Show the result section
                loading.classList.add('hidden');
                politicianResult.classList.remove('hidden');
            } else {
                // Handle no results found
                alert(data.message || 'No politician found. Please try a different search.');
                loading.classList.add('hidden');
                searchForm.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error searching for politician:', error);
            alert('An error occurred while searching. Please try again.');
            loading.classList.add('hidden');
            searchForm.classList.remove('hidden');
        }
    });

    // Handle refine search button click
    refineButton.addEventListener('click', () => {
        politicianResult.classList.add('hidden');
        refineSearchSection.classList.remove('hidden');
    });

    // Handle refine search form submission
    refineForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show loading spinner
        refineSearchSection.classList.add('hidden');
        loading.classList.remove('hidden');
        
        try {
            const response = await fetch('/api/refine-search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: politicianName.value,
                    state: politicianState.value,
                    additionalInfo: additionalInfo.value,
                    refineInfo: refineInfo.value
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                currentPolitician = data.politician;
                
                // Display the result
                resultPhoto.src = currentPolitician.photoUrl;
                resultName.textContent = currentPolitician.name;
                resultTitle.textContent = currentPolitician.title;
                
                // Show the result section
                loading.classList.add('hidden');
                politicianResult.classList.remove('hidden');
            } else {
                // Handle no results found
                alert(data.message || 'No politician found. Please try a different search.');
                loading.classList.add('hidden');
                refineSearchSection.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error refining search:', error);
            alert('An error occurred while searching. Please try again.');
            loading.classList.add('hidden');
            refineSearchSection.classList.remove('hidden');
        }
    });

    // Handle confirm politician button click
    confirmButton.addEventListener('click', async () => {
        if (!currentPolitician) return;
        
        // Switch to detail view
        searchSection.classList.remove('active');
        searchSection.classList.add('hidden');
        detailSection.classList.add('active');
        detailSection.classList.remove('hidden');
        
        // Show loading spinner
        detailLoading.classList.remove('hidden');
        
        try {
            const response = await fetch(`/api/politician-details/${currentPolitician.id}`);
            const data = await response.json();
            
            if (data.success) {
                // Update the politician with full details
                currentPolitician = data.politician;
                
                // Fill in the detail view with politician information
                displayPoliticianDetails(currentPolitician);
                
                // Hide loading spinner
                detailLoading.classList.add('hidden');
            } else {
                alert(data.message || 'Failed to load politician details.');
                backToSearch();
            }
        } catch (error) {
            console.error('Error fetching politician details:', error);
            alert('An error occurred while loading details. Please try again.');
            backToSearch();
        }
    });

    // Function to display politician details
    function displayPoliticianDetails(politician) {
        // Basic details
        detailPhoto.src = politician.photoUrl;
        detailName.textContent = politician.name;
        detailPosition.textContent = politician.title;
        detailState.textContent = `State: ${politician.state}`;
        detailAge.textContent = `Age: ${politician.age}`;
        
        // Biography
        bioContent.innerHTML = `<p>${politician.biography}</p>`;
        
        // Donations
        if (politician.donations && politician.donations.length > 0) {
            const donationsHtml = politician.donations.map(donation => `
                <div class="donation-item">
                    <h4>${donation.donor}</h4>
                    <p>Amount: $${donation.amount.toLocaleString()}</p>
                    <p>Year: ${donation.year}</p>
                </div>
            `).join('');
            
            donationsContent.innerHTML = donationsHtml;
        } else {
            donationsContent.innerHTML = '<p>No donation information available.</p>';
        }
        
        // Israel donations
        if (politician.israelDonations && politician.israelDonations.length > 0) {
            const israelDonationsHtml = politician.israelDonations.map(donation => `
                <div class="donation-item">
                    <h4>${donation.donor}</h4>
                    <p>Amount: $${donation.amount.toLocaleString()}</p>
                    <p>Year: ${donation.year}</p>
                </div>
            `).join('');
            
            israelDonationsContent.innerHTML = israelDonationsHtml;
        } else {
            israelDonationsContent.innerHTML = '<p>No donations from pro-Israel groups found.</p>';
        }
        
        // News articles
        if (politician.news && politician.news.length > 0) {
            const newsHtml = politician.news.map(article => `
                <div class="news-item">
                    <h4>${article.title}</h4>
                    <p>${article.summary}</p>
                    <p class="news-date">${article.date}</p>
                    <a class="news-link" href="${article.url}" target="_blank">Read full article</a>
                </div>
            `).join('');
            
            newsContent.innerHTML = newsHtml;
        } else {
            newsContent.innerHTML = '<p>No recent news articles found.</p>';
        }
        
        // Tweets
        if (politician.tweets && politician.tweets.length > 0) {
            const tweetsHtml = politician.tweets.map(tweet => `
                <div class="tweet-item">
                    <p>${tweet.text}</p>
                    <p class="tweet-date">${tweet.date}</p>
                </div>
            `).join('');
            
            tweetsContent.innerHTML = tweetsHtml;
        } else {
            tweetsContent.innerHTML = '<p>No recent tweets found.</p>';
        }
    }

    // Handle tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button and corresponding pane
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Handle back to search button
    backToSearchButton.addEventListener('click', backToSearch);
    
    function backToSearch() {
        // Switch back to search view
        detailSection.classList.remove('active');
        detailSection.classList.add('hidden');
        searchSection.classList.add('active');
        searchSection.classList.remove('hidden');
        
        // Reset the search form
        politicianResult.classList.add('hidden');
        refineSearchSection.classList.add('hidden');
        searchForm.classList.remove('hidden');
        
        // Clear form fields
        searchForm.reset();
        refineForm.reset();
    }
});
