<?php
//jangan tampilkan error detail ke browser (log saja)
ini_set('display_errors', getenv('APP_DEBUG') ? '1' : '0');

//load .env sederhana (tanpa dependency) bila file .env ada
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0 || strpos($line, '=') === false) {
            continue;
        }
        list($k, $v) = explode('=', $line, 2);
        $k = trim($k);
        $v = trim($v);
        if (!getenv($k)) {
            putenv("$k=$v");
            $_ENV[$k] = $v;
        }
    }
}

//kredensial dari environment variable (fallback ke nilai default lokal)
$dbname = getenv('DB_NAME') ?: 'dbtechmuda42';
$dbhost = getenv('DB_HOST') ?: 'localhost';
$user   = getenv('DB_USER') ?: 'root';
$password = getenv('DB_PASS') ?: '';

/* Connect to a MySQL database using driver invocation */
$dsn = "mysql:dbname=$dbname;host=$dbhost";

try {
    $dbh = new PDO($dsn, $user, $password);
    $dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $dbh->setAttribute(PDO::MYSQL_ATTR_USE_BUFFERED_QUERY, TRUE);
} catch (PDOException $e) {
    error_log('DB connection failed: ' . $e->getMessage());
    die('Database connection failed.');
}

//escaping output untuk mencegah XSS
function e($value)
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

//token anti-CSRF
function csrf_token()
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function csrf_check()
{
    if (empty($_SESSION['csrf_token']) || !isset($_POST['csrf_token']) ||
        !hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'])) {
        header('Location:index.php?hal=home');
        exit;
    }
}
