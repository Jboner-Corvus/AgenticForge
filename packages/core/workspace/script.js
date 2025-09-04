document.addEventListener('DOMContentLoaded', () => {
    const interactiveButton = document.getElementById('interactiveButton');
    const contactForm = document.getElementById('contactForm');
    const formFeedback = document.getElementById('formFeedback');

    if (interactiveButton) {
        interactiveButton.addEventListener('click', () => {
            alert('Button clicked! You are interacting with AgenticForge.');
            // Example of a simple animation for the button
            interactiveButton.style.transform = 'scale(1.1)';
            setTimeout(() => {
                interactiveButton.style.transform = 'scale(1)';
            }, 200);
        });
    }

    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Prevent default form submission

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;

            if (name && email && message) {
                // Simulate form submission
                console.log('Form Submitted:', { name, email, message });
                formFeedback.textContent = 'Thank you for your message, ' + name + '! We will get back to you shortly.';
                formFeedback.className = 'feedback-message success';
                formFeedback.style.display = 'block';
                contactForm.reset(); // Clear the form
            } else {
                formFeedback.textContent = 'Please fill in all fields.';
                formFeedback.className = 'feedback-message error';
                formFeedback.style.display = 'block';
            }
        });
    }
});