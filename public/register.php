<?php

declare(strict_types=1);

$errors = [];

$username = '';
$password = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    // Username validation
    if ($username === '') {
        $errors[] = 'Username is required.';
    } elseif (strlen($username) > 50) {
        $errors[] = 'Username must be 50 characters or fewer.';
    }

    // Password validation
    if ($password === '') {
        $errors[] = 'Password is required.';
    } elseif (strlen($password) < 8) {
        $errors[] = 'Password must be at least 8 characters long.';
    } elseif (!preg_match('/[A-Z]/', $password)) {
        $errors[] = 'Password must contain at least one uppercase letter.';
    } elseif (!preg_match('/[a-z]/', $password)) {
        $errors[] = 'Password must contain at least one lowercase letter.';
    } elseif (!preg_match('/[0-9]/', $password)) {
        $errors[] = 'Password must contain at least one number.';
    } elseif (!preg_match('/[^A-Za-z0-9]/', $password)) {
        $errors[] = 'Password must contain at least one special character.';
    }

    if (empty($errors)) {
        $success = 'Validation successful. Account creation will be added next.';
    }
}

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

        <?php if (!empty($errors)): ?>
            <div>
                <?php foreach ($errors as $error): ?>
                    <p><?= htmlspecialchars($error) ?></p>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

        <?php if (isset($success)): ?>
            <p><?= htmlspecialchars($success) ?></p>
        <?php endif; ?>

        <form action="register.php" method="POST">

            <div>
                <label for="username">Username</label>
                <input
                    type="text"
                    id="username"
                    name="username"
                    value="<?= htmlspecialchars($username) ?>"
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