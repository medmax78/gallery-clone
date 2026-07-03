<?php
require_once __DIR__ . '/config/db.php';

// ── Fetch all vessels with their dishes ───────────────────────────────────────
$vessels = db()->query("SELECT * FROM vessels ORDER BY name")->fetchAll();
$vesselIds = array_column($vessels, 'id');

$dishes = [];
if ($vesselIds) {
    $placeholders = implode(',', array_fill(0, count($vesselIds), '?'));
    $stmt = db()->prepare("SELECT * FROM dishes WHERE vessel_id IN ($placeholders) ORDER BY date DESC");
    $stmt->execute($vesselIds);
    foreach ($stmt->fetchAll() as $d) {
        $dishes[$d['vessel_id']][] = $d;
    }
}

// Attach dishes + compute rating to each vessel
foreach ($vessels as &$v) {
    $v['dishes'] = $dishes[$v['id']] ?? [];
    $v['rating'] = count($v['dishes'])
        ? round(array_sum(array_column($v['dishes'], 'rating')) / count($v['dishes']), 1)
        : 0;
}
unset($v);

// ── Top / Worst dishes ────────────────────────────────────────────────────────
$allDishes = array_merge(...array_column($vessels, 'dishes') ?: [[]]);
$rated = array_filter($allDishes, fn($d) => $d['votes'] > 0);
usort($rated, fn($a,$b) => $b['rating'] <=> $a['rating']);
$topDish   = $rated[0] ?? null;
$worstDish = count($rated) > 1 ? end($rated) : null;

// ── Helpers ───────────────────────────────────────────────────────────────────
function stars(float $r, bool $interactive = false, string $dishId = ''): string {
    $html = '<span class="stars"' . ($interactive ? ' data-dish="' . htmlspecialchars($dishId) . '"' : '') . '>';
    for ($i = 1; $i <= 5; $i++) {
        $lit = $i <= round($r);
        $cls = $lit ? 'lb-star lit' : 'lb-star';
        if ($interactive) {
            $html .= '<span class="' . $cls . '" data-val="' . $i . '" onclick="rateDish(\'' . htmlspecialchars($dishId) . '\',' . $i . ',this)">&#9733;</span>';
        } else {
            $html .= '<span class="' . ($lit ? '' : 'empty') . '">&#9733;</span>';
        }
    }
    return $html . '</span>';
}

function groupByYearMonth(array $dishes): array {
    $tree = [];
    foreach ($dishes as $d) {
        $y = date('Y', strtotime($d['date']));
        $m = date('F', strtotime($d['date']));   // "January"
        $day = date('j F', strtotime($d['date']));
        $tree[$y][$m][$day][] = $d;
    }
    return $tree;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Swire Bulk — Galley Gallery</title>
  <meta name="description" content="Real dishes served on board Swire Bulk vessels, with anonymous crew reviews.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>

<div class="container">

  <!-- Hero -->
  <div class="hero-wrap">
    <img src="/public/hero-ship.jpg" alt="Swire Bulk vessel at sea" class="hero">
  </div>

  <!-- Intro panel -->
  <div class="intro-panel">
    <h2>Swire Bulk Galley Gallery</h2>
    <p>Real food served on board — photographed and rated anonymously by crew. Browse by vessel, year and month. Click a photo to rate it.</p>
    <div class="viewer-count">&#128065; <?= rand(3,12) ?> crew viewing now</div>
    <div class="vessel-chips">
      <?php foreach ($vessels as $v): ?>
        <button class="chip" onclick="selectVessel('<?= htmlspecialchars($v['id']) ?>')" id="chip-<?= $v['id'] ?>">
          <?= htmlspecialchars($v['name']) ?>
        </button>
      <?php endforeach; ?>
    </div>
  </div>

  <!-- Vessel detail (shown when a chip is clicked) -->
  <?php foreach ($vessels as $v): ?>
  <div class="card" id="vessel-<?= $v['id'] ?>" style="display:none">
    <div class="flex items-center gap-2 justify-between" style="margin-bottom:.75rem">
      <div class="flex items-center gap-2">
        <img src="<?= htmlspecialchars($v['thumbnail']) ?>" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid var(--border)">
        <div>
          <div style="font-weight:700"><?= htmlspecialchars($v['name']) ?></div>
          <div class="text-sm text-muted"><?= count($v['dishes']) ?> photos &middot; <?= stars($v['rating']) ?> <?= $v['rating'] ?></div>
        </div>
      </div>
    </div>

    <?php if (empty($v['dishes'])): ?>
      <p class="text-muted text-sm">No photos uploaded yet.</p>
    <?php else: ?>
      <?php foreach (groupByYearMonth($v['dishes']) as $year => $months): ?>
        <div class="card2">
          <button class="accordion-btn" onclick="toggleAcc(this)">
            <span class="chevron">&#9660;</span>
            <?= $year ?>
            <span class="text-muted text-sm">(<?= array_sum(array_map('count', array_merge(...array_values($months)))) ?> photos)</span>
          </button>
          <div class="accordion-content">
            <?php foreach ($months as $month => $days): ?>
              <div style="margin-bottom:.4rem">
                <button class="accordion-btn" onclick="toggleAcc(this)" style="font-size:.82rem;font-weight:600;color:var(--muted)">
                  <span class="chevron">&#9660;</span>
                  <?= strtoupper($month) ?>
                  <span class="text-muted text-sm">(<?= array_sum(array_map('count', $days)) ?>)</span>
                </button>
                <div class="accordion-content">
                  <?php foreach ($days as $day => $dayDishes): ?>
                    <div style="margin-bottom:.4rem">
                      <button class="accordion-btn" onclick="toggleAcc(this)" style="font-size:.78rem;color:var(--muted);font-weight:400">
                        <span class="chevron">&#9660;</span>
                        <?= htmlspecialchars($day) ?>
                        <span class="text-muted text-sm">(<?= count($dayDishes) ?>)</span>
                      </button>
                      <div class="accordion-content">
                        <div class="photo-grid">
                          <?php foreach ($dayDishes as $idx => $dish): ?>
                            <div class="photo-item"
                                 onclick="openLightbox(<?= htmlspecialchars(json_encode(array_values($dayDishes))) ?>, <?= $idx ?>)">
                              <img src="<?= htmlspecialchars($dish['image']) ?>" alt="Dish photo" loading="lazy">
                              <div class="photo-rating">
                                <?= $dish['votes'] > 0 ? '&#9733; ' . number_format($dish['rating'],1) : 'Not rated' ?>
                              </div>
                            </div>
                          <?php endforeach; ?>
                        </div>
                      </div>
                    </div>
                  <?php endforeach; ?>
                </div>
              </div>
            <?php endforeach; ?>
          </div>
        </div>
      <?php endforeach; ?>
    <?php endif; ?>
  </div>
  <?php endforeach; ?>

  <!-- Top / Worst -->
  <?php if ($topDish || $worstDish): ?>
  <div class="card">
    <div class="section-title">Top &amp; Worst Dishes</div>
    <div class="tw-grid">
      <?php if ($topDish): ?>
      <div class="tw-card" onclick="openLightboxSingle(<?= htmlspecialchars(json_encode($topDish)) ?>)" style="cursor:pointer">
        <img src="<?= htmlspecialchars($topDish['image']) ?>" alt="Top dish">
        <span class="tw-label top">Top</span>
        <div class="tw-rating">&#9733; <?= number_format($topDish['rating'],1) ?></div>
      </div>
      <?php endif; ?>
      <?php if ($worstDish): ?>
      <div class="tw-card" onclick="openLightboxSingle(<?= htmlspecialchars(json_encode($worstDish)) ?>)" style="cursor:pointer">
        <img src="<?= htmlspecialchars($worstDish['image']) ?>" alt="Worst dish">
        <span class="tw-label worst">Worst</span>
        <div class="tw-rating">&#9733; <?= number_format($worstDish['rating'],1) ?></div>
      </div>
      <?php endif; ?>
    </div>
  </div>
  <?php endif; ?>

</div><!-- /container -->

<!-- Lightbox -->
<div id="lightbox">
  <div class="lb-inner">
    <button class="lb-close" onclick="closeLightbox()">&#10005;</button>
    <img id="lb-img" src="" alt="Dish photo">
    <div class="lb-meta">
      <div id="lb-date" class="lb-date"></div>
      <div id="lb-stars" class="lb-stars" style="margin-top:.3rem"></div>
      <div id="lb-rating" class="text-sm text-muted" style="margin-top:.2rem"></div>
    </div>
    <div class="lb-nav">
      <button onclick="navLightbox(-1)">&#8592;</button>
      <span id="lb-counter" class="text-sm text-muted"></span>
      <button onclick="navLightbox(1)">&#8594;</button>
    </div>
  </div>
</div>

<footer>
  <a href="/admin/">Admin Panel</a> &nbsp;&middot;&nbsp;
  Swire Bulk Galley Gallery
</footer>

<script src="/assets/js/gallery.js"></script>
</body>
</html>
