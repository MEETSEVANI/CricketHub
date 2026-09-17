<?php

declare(strict_types=1);

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - CricketHub</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

    <main>
        <h1>Create a CricketHub Account</h1>

        <p>Create a Registered User account to access CricketHub.</p>

        <form action="register.php" method="POST">

            <div>
                <label for="username">Username</label>
                <input
                    type="text"
                    id="username"
                    name="username"
                    required
                    maxlength="50"
                >
            </div>

            <div>
                <label for="password">Password</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    required
                >
            </div>

            <button type="submit">Create Account</button>

        </form>

        <p>Login functionality will be available soon.</p>
    </main>

</body>
</html>