$(document).ready(function () {
    $("form").on("submit", function (e) {
        e.preventDefault();

        Notiflix.Notify.init({ position: "right-top" });

        let fields = ["first_name", "last_name", "username", "email", "password", "confirm_password"];
        let data = {}, isValid = true;

        // Validate fields
        fields.forEach(field => {
            let value = $(`input[name='${field}']`).val().trim();
            data[field] = value;
            if (!value) {
                Notiflix.Notify.failure("All fields are required.");
                isValid = false;
                return false;
            }
        });

        if (!isValid) return;

        // Username validation: only letters, digits, underscore, and dot; must not start with digit or dot
        let usernameRegex = /^(?![\d.])[a-zA-Z0-9._]+$/;
        if (!usernameRegex.test(data.username)) 
            return Notiflix.Notify.failure("Username can only contain letters, digits, '_', and '.', but must not start with a digit or '.'");

        // Email validation
        if (!/^\S+@\S+\.\S+$/.test(data.email)) 
            return Notiflix.Notify.failure("Enter a valid email.");

        // Password validation
        if (data.password.length < 6) 
            return Notiflix.Notify.failure("Password must be at least 6 characters.");
        if (data.password !== data.confirm_password) 
            return Notiflix.Notify.failure("Passwords do not match.");

        // Show success message and submit form
        Notiflix.Notify.success("Registration successful!");
        this.submit();
    });
});