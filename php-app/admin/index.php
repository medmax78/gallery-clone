<?php
session_start();
require_once __DIR__ . '/../config/db.php';

$error   = '';
$success = '';
$tab     = $_GET['tab'] ?? 'vessels';

// ── Login / Logout ────────────────────────────────────────────────────────────
if (isset($_POST['action']) && $_POST['action'] === 'login') {
    $u = trim($_POST['username'] ?? '');
    $p = $_POST['password'] ?? '';
    $row = db()->query("SELECT * FROM admin_credentials WHERE id = 1")->fetch();
    if ($row && $row['username'] === $u && $row['password'] === $p) {
        $_SESSION['admin']    = true;
        $_SESSION['username'] = $u;
        header('Location: /admin/');
        exit;
    }
    $error = 'Invalid username or password.';
}

if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: /admin/');
    exit;
}

$loggedIn = !empty($_SESSION['admin']);

// ── Admin POST actions (require login) ────────────────────────────────────────
if ($loggedIn && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    // Add vessel
    if ($action === 'add_vessel') {
        $name = trim($_POST['name'] ?? '');
        if ($name) {
            $id = 'v-' . bin2hex(random_bytes(4));
            $stmt = db()->prepare("INSERT IGNORE INTO vessels (id, name, thumbnail) VALUES (?,?,?)");
            $stmt->execute([$id, $name, '/public/vessels/default.jpg']);
        }
        header('Location: /admin/?tab=vessels');
        exit;
    }

    // Rename vessel
    if ($action === 'rename_vessel') {
        $id   = $_POST['id']   ?? '';
        $name = trim($_POST['name'] ?? '');
        if ($id && $name) {
            db()->prepare("UPDATE vessels SET name=? WHERE id=?")->execute([$name, $id]);
        }
        header('Location: /admin/?tab=vessels');
        exit;
    }

    // Delete vessel
    if ($action === 'delete_vessel') {
        $id = $_POST['id'] ?? '';
        if ($id) {
            db()->prepare("DELETE FROM dishes  WHERE vessel_id=?")->execute([$id]);
            db()->prepare("DELETE FROM vessels WHERE id=?")->execute([$id]);
        }
        header('Location: /admin/?tab=vessels');
        exit;
    }

    // Delete dish
    if ($action === 'delete_dish') {
        $id = $_POST['dish_id'] ?? '';
        if ($id) {
            $dish = db()->prepare("SELECT image FROM dishes WHERE id=?");
            $dish->execute([$id]);
            $row = $dish->fetch();
            if ($row) {
                $path = __DIR__ . '/..' . $row['image'];
                if (file_exists($path)) @unlink($path);
            }
            db()->prepare("DELETE FROM dishes WHERE id=?")->execute([$id]);
        }
        header('Location: /admin/?tab=vessels&vid=' . ($_POST['vessel_id'] ?? ''));
        exit;
    }

    // Change credentials
    if ($action === 'change_credentials') {
        $current  = $_POST['current_password'] ?? '';
        $newUser  = trim($_POST['new_username'] ?? '');
        $newPass  = $_POST['new_password'] ?? '';
        $newPass2 = $_POST['new_password2'] ?? '';
        $row = db()->query("SELECT * FROM admin_credentials WHERE id=1")->fetch();

        if (!$row || $row['password'] !== $current) {
            $error = 'Current password is incorrect.';
        } elseif (!$newUser) {
            $error = 'Username cannot be empty.';
        } elseif ($newPass && strlen($newPass) < 6) {
            $error = 'New password must be at least 6 characters.';
        } elseif ($newPass && $newPass !== $newPass2) {
            $error = 'Passwords do not match.';
        } else {
            $finalPass = $newPass ?: $row['password'];
            db()->prepare("INSERT INTO admin_credentials (id,username,password) VALUES (1,?,?) ON DUPLICATE KEY UPDATE username=?, password=?")
                ->execute([$newUser, $finalPass, $newUser, $finalPass]);
            $_SESSION['username'] = $newUser;
            $success = 'Credentials updated successfully.';
        }
        $tab = 'credentials';
    }
}

// ── Data for admin panel ──────────────────────────────────────────────────────
if ($loggedIn) {
    $vessels = db()->query("SELECT * FROM vessels ORDER BY name")->fetchAll();
    $vesselIds = array_column($vessels, 'id');

    $dishMap = [];
    if ($vesselIds) {
        $ph   = implode(',', array_fill(0, count($vesselIds), '?'));
        $stmt = db()->prepare("SELECT * FROM dishes WHERE vessel_id IN ($ph) ORDER BY date DESC");
        $stmt->execute($vesselIds);
        foreach ($stmt->fetchAll() as $d) {
            $dishMap[$d['vessel_id']][] = $d;
        }
    }
    foreach ($vessels as &$v) {
        $v['dishes'] = $dishMap[$v['id']] ?? [];
        $v['rating'] = count($v['dishes'])
            ? round(array_sum(array_column($v['dishes'], 'rating')) / count($v['dishes']), 1)
            : 0;
    }
    unset($v);

    $totalPhotos  = array_sum(array_map(fn($v) => count($v['dishes']), $vessels));
    $allRated     = array_filter(array_merge(...array_column($vessels, 'dishes') ?: [[]]), fn($d) => $d['votes'] > 0);
    $avgRating    = $allRated
        ? round(array_sum(array_column(array_values($allRated), 'rating')) / count($allRated), 1)
        : 0;
    $totalVotes   = array_sum(array_column(array_values($allRated), 'votes'));
}

$openVessel = $_GET['vid'] ?? null;
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Admin — Swire Bulk Gallery</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>

<?php if (!$loggedIn): ?>
<!-- ─── LOGIN ─────────────────────────────────────────────── -->
<div style="min-height:100vh;display:flex;align-items:center;justify-content:center">
  <div style="width:min(380px,92vw)">
    <div style="text-align:center;margin-bottom:1.5rem">
      <div style="font-size:1.6rem;font-weight:700;color:var(--gold)">Swire Bulk</div>
      <div style="font-size:.85rem;color:var(--muted);margin-top:.25rem">Admin Panel</div>
    </div>
    <?php if ($error): ?>
      <div class="alert alert-error"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>
    <form method="post" class="card">
      <input type="hidden" name="action" value="login">
      <div class="form-group">
        <label>Username</label>
        <input type="text" name="username" class="form-control" required autofocus>
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" name="password" class="form-control" required>
      </div>
      <button type="submit" class="btn btn-gold w-full" style="justify-content:center">Sign In</button>
    </form>
    <div style="text-align:center;margin-top:.75rem">
      <a href="/" class="text-muted text-sm">&larr; Back to Gallery</a>
    </div>
  </div>
</div>

<?php else: ?>
<!-- ─── ADMIN PANEL ────────────────────────────────────────── -->
<div class="admin-header">
  <h1>Swire Bulk Admin</h1>
  <div class="flex items-center gap-2">
    <span class="meta">Signed in as <strong><?= htmlspecialchars($_SESSION['username']) ?></strong></span>
    <a href="?tab=credentials" class="btn btn-muted btn-sm">Change credentials</a>
    <a href="?logout=1" class="btn btn-muted btn-sm">Sign out</a>
    <a href="/" class="btn btn-muted btn-sm">&larr; Gallery</a>
  </div>
</div>

<div class="admin-body">

  <?php if ($error):   ?><div class="alert alert-error"><?= htmlspecialchars($error) ?></div><?php endif; ?>
  <?php if ($success): ?><div class="alert alert-success"><?= htmlspecialchars($success) ?></div><?php endif; ?>

  <!-- Stats -->
  <div class="stats-grid">
    <div class="stat-card"><div class="val"><?= count($vessels) ?></div><div class="lbl">Vessels</div></div>
    <div class="stat-card"><div class="val"><?= $totalPhotos ?></div><div class="lbl">Photos</div></div>
    <div class="stat-card"><div class="val"><?= $avgRating ?></div><div class="lbl">Avg Rating</div></div>
    <div class="stat-card"><div class="val"><?= $totalVotes ?></div><div class="lbl">Total Votes</div></div>
  </div>

  <?php if ($tab === 'credentials'): ?>
  <!-- ─── CHANGE CREDENTIALS ─── -->
  <div class="card">
    <div class="section-title">Change Login Credentials</div>
    <form method="post" style="max-width:380px">
      <input type="hidden" name="action" value="change_credentials">
      <div class="form-group">
        <label>Current password</label>
        <input type="password" name="current_password" class="form-control" required>
      </div>
      <div class="form-group">
        <label>New username</label>
        <input type="text" name="new_username" class="form-control"
               value="<?= htmlspecialchars($_SESSION['username']) ?>" required>
      </div>
      <div class="form-group">
        <label>New password <span class="text-muted">(leave blank to keep current)</span></label>
        <input type="password" name="new_password" class="form-control" minlength="6">
      </div>
      <div class="form-group">
        <label>Confirm new password</label>
        <input type="password" name="new_password2" class="form-control" minlength="6">
      </div>
      <div class="flex gap-2">
        <button type="submit" class="btn btn-gold">Save</button>
        <a href="/admin/" class="btn btn-muted">Cancel</a>
      </div>
    </form>
  </div>

  <?php else: ?>
  <!-- ─── VESSEL MANAGER ─── -->
  <div class="card">
    <div class="section-title">Manage Vessels</div>

    <!-- Add vessel form -->
    <form method="post" class="flex gap-2" style="margin-bottom:1rem">
      <input type="hidden" name="action" value="add_vessel">
      <input type="text" name="name" class="form-control" placeholder="New vessel name e.g. mv Taishan" required style="flex:1">
      <button type="submit" class="btn btn-gold">+ Add</button>
    </form>

    <!-- Vessel list -->
    <?php foreach ($vessels as $v):
      $isOpen = ($openVessel === $v['id']);
    ?>
    <div class="vessel-row">
      <div class="vessel-row-header">
        <!-- Thumbnail / change logo -->
        <label title="Change vessel photo / logo" style="cursor:pointer">
          <img src="<?= htmlspecialchars($v['thumbnail']) ?>"
               alt="" class="vessel-thumb" id="thumb-<?= $v['id'] ?>">
          <input type="file" accept="image/*" style="display:none"
                 onchange="uploadThumb('<?= $v['id'] ?>', '<?= htmlspecialchars(addslashes($v['name'])) ?>', this)">
        </label>

        <!-- Name / toggle dishes -->
        <button class="vessel-name-toggle" onclick="toggleVessel('<?= $v['id'] ?>')">
          <?= htmlspecialchars($v['name']) ?>
          <span class="vessel-sub"><?= count($v['dishes']) ?> photos &middot; <?= $v['rating'] ?>&#9733;</span>
        </button>

        <!-- Actions -->
        <div class="vessel-actions">
          <button class="icon-btn" title="Rename" onclick="promptRename('<?= $v['id'] ?>', '<?= htmlspecialchars(addslashes($v['name'])) ?>')">&#9998;</button>
          <button class="icon-btn danger" title="Delete" onclick="confirmDelete('<?= $v['id'] ?>', '<?= htmlspecialchars(addslashes($v['name'])) ?>')">&#128465;</button>
        </div>
      </div>

      <!-- Dish manager (collapsible) -->
      <div class="vessel-body <?= $isOpen ? 'open' : '' ?>" id="vbody-<?= $v['id'] ?>">
        <div class="section-title" style="margin-bottom:.5rem">Upload Photos</div>

        <!-- Drop zone -->
        <div class="drop-zone" id="drop-<?= $v['id'] ?>"
             onclick="document.getElementById('file-<?= $v['id'] ?>').click()"
             ondragover="event.preventDefault();this.classList.add('dragover')"
             ondragleave="this.classList.remove('dragover')"
             ondrop="handleDrop(event,'<?= $v['id'] ?>', '<?= htmlspecialchars(addslashes($v['name'])) ?>')">
          &#8679; Drag &amp; drop photos here, or click to browse<br>
          <span class="text-sm" style="margin-top:.3rem;display:block">Multiple files supported &middot; Date auto-read from EXIF</span>
        </div>
        <input type="file" id="file-<?= $v['id'] ?>" multiple accept="image/*" style="display:none"
               onchange="stageFiles(this.files,'<?= $v['id'] ?>','<?= htmlspecialchars(addslashes($v['name'])) ?>')">

        <!-- Staged queue -->
        <div id="staged-<?= $v['id'] ?>" class="staged-grid"></div>
        <div id="upload-btn-<?= $v['id'] ?>" style="display:none;margin-top:.5rem">
          <button class="btn btn-gold" onclick="uploadStaged('<?= $v['id'] ?>', '<?= htmlspecialchars(addslashes($v['name'])) ?>')">
            &#8679; Upload photos
          </button>
          <button class="btn btn-muted" style="margin-left:.4rem" onclick="clearStaged('<?= $v['id'] ?>')">Clear</button>
        </div>

        <!-- Existing dishes -->
        <?php if ($v['dishes']): ?>
        <div class="section-title" style="margin-top:1rem;margin-bottom:.5rem">Existing Photos</div>
        <div class="dish-admin-grid">
          <?php foreach ($v['dishes'] as $d): ?>
          <div class="dish-admin-item">
            <img src="<?= htmlspecialchars($d['image']) ?>" alt="" loading="lazy">
            <div class="dish-admin-meta">
              <?= date('d M Y', strtotime($d['date'])) ?> &middot;
              <?= $d['votes'] > 0 ? number_format($d['rating'],1).'&#9733;' : 'Unrated' ?>
            </div>
            <form method="post" style="position:absolute;top:.25rem;right:.25rem"
                  onsubmit="return confirm('Delete this photo?')">
              <input type="hidden" name="action"    value="delete_dish">
              <input type="hidden" name="dish_id"   value="<?= $d['id'] ?>">
              <input type="hidden" name="vessel_id" value="<?= $v['id'] ?>">
              <button type="submit" class="dish-admin-delete">&#10005;</button>
            </form>
          </div>
          <?php endforeach; ?>
        </div>
        <?php endif; ?>
      </div>
    </div>
    <?php endforeach; ?>
  </div>
  <?php endif; ?>

</div><!-- /admin-body -->

<!-- Rename modal -->
<div class="modal-overlay" id="rename-modal">
  <div class="modal">
    <h3>Rename Vessel</h3>
    <form method="post" id="rename-form">
      <input type="hidden" name="action" value="rename_vessel">
      <input type="hidden" name="id" id="rename-id">
      <div class="form-group">
        <label>New name</label>
        <input type="text" name="name" id="rename-name" class="form-control" required>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-muted" onclick="closeModal('rename-modal')">Cancel</button>
        <button type="submit" class="btn btn-gold">Save</button>
      </div>
    </form>
  </div>
</div>

<!-- Delete confirm modal -->
<div class="modal-overlay" id="delete-modal">
  <div class="modal">
    <h3>Delete Vessel</h3>
    <p class="confirm-msg" id="delete-msg"></p>
    <form method="post" id="delete-form">
      <input type="hidden" name="action" value="delete_vessel">
      <input type="hidden" name="id" id="delete-id">
      <div class="modal-footer">
        <button type="button" class="btn btn-muted" onclick="closeModal('delete-modal')">Cancel</button>
        <button type="submit" class="btn btn-danger">Delete</button>
      </div>
    </form>
  </div>
</div>

<?php endif; ?>

<script src="/assets/js/admin.js"></script>
</body>
</html>
