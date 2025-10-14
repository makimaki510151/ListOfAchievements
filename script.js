/**
 * script.js
 * 実績リストの表示、進捗計算、localStorage管理（アコーディオン対応版）
 */

const STORAGE_KEY = 'achievementTrackerState';
const COLLAPSE_STATE_KEY = 'achievementCollapseState'; // カテゴリ開閉状態用のキー
let achievementState = {}; // チェック状態を保持するオブジェクト
let collapseState = {}; // カテゴリ開閉状態を保持するオブジェクト

// -------------------- 1. ローカルストレージからの読み込み --------------------
function loadState() {
    const storedState = localStorage.getItem(STORAGE_KEY);
    if (storedState) {
        achievementState = JSON.parse(storedState);
    } else {
        // 初回ロード時、すべての実績IDをキーとして初期状態をfalseに設定
        achievementsData.forEach(category => {
            category.items.forEach(item => {
                achievementState[item.id] = false;
            });
        });
        saveState();
    }

    const storedCollapseState = localStorage.getItem(COLLAPSE_STATE_KEY);
    if (storedCollapseState) {
        collapseState = JSON.parse(storedCollapseState);
    }
}

// -------------------- 2. ローカルストレージへの保存 --------------------
function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(achievementState));
}

function saveCollapseState() {
    localStorage.setItem(COLLAPSE_STATE_KEY, JSON.stringify(collapseState));
}

// -------------------- 3. 実績リストのUI生成（グリッド＆アコーディオン） --------------------
function renderAchievements() {
    const listContainer = document.getElementById('achievements-list');
    listContainer.innerHTML = ''; // 既存の内容をクリア

    achievementsData.forEach(categoryData => {
        const categoryID = categoryData.category.replace(/\s/g, '-');
        // デフォルトで開いているかどうかをチェック
        const isCollapsed = collapseState[categoryID] === false; // falseなら開いている

        const categorySection = document.createElement('div');
        categorySection.className = 'category-section';

        // カテゴリヘッダー (アコーディオンのトリガー)
        const categoryHeader = document.createElement('div');
        categoryHeader.className = `category-header ${isCollapsed ? 'active' : ''}`;
        categoryHeader.setAttribute('data-category-id', categoryID);
        categoryHeader.innerHTML = `
            <h3>${categoryData.category}</h3>
            <div>
                <span id="progress-${categoryID}" class="category-progress">0/${categoryData.items.length}</span>
                <span class="toggle-icon">${isCollapsed ? '▼' : '▶'}</span>
            </div>
        `;
        categoryHeader.addEventListener('click', toggleCategory);
        categorySection.appendChild(categoryHeader);

        // 実績コンテンツ (グリッドコンテナ)
        const achievementContent = document.createElement('div');
        achievementContent.className = 'achievement-content';
        achievementContent.style.maxHeight = isCollapsed ? '5000px' : '0'; // 開閉状態を反映

        const achievementGrid = document.createElement('ul');
        achievementGrid.className = 'achievement-grid';

        categoryData.items.forEach(item => {
            const listItem = document.createElement('li');
            listItem.className = 'achievement-item';
            
            const isChecked = achievementState[item.id] || false;

            listItem.innerHTML = `
                <input type="checkbox" id="${item.id}" data-id="${item.id}" ${isChecked ? 'checked' : ''}>
                <label for="${item.id}">${item.name}</label>
            `;
            achievementGrid.appendChild(listItem);
        });

        achievementContent.appendChild(achievementGrid);
        categorySection.appendChild(achievementContent);
        listContainer.appendChild(categorySection);
    });

    // チェックボックスにイベントリスナーを設定
    document.querySelectorAll('.achievement-item input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleCheckboxChange);
    });
}

// -------------------- 4. アコーディオン開閉処理 --------------------
function toggleCategory(event) {
    const header = event.currentTarget;
    const content = header.nextElementSibling;
    const icon = header.querySelector('.toggle-icon');
    const categoryID = header.dataset.categoryId;

    const isActive = header.classList.toggle('active');

    if (isActive) {
        // 開く
        content.style.maxHeight = '5000px'; 
        icon.textContent = '▼';
        collapseState[categoryID] = false; // 開いている状態を保存
    } else {
        // 閉じる
        content.style.maxHeight = '0';
        icon.textContent = '▶';
        collapseState[categoryID] = true; // 閉じている状態を保存
    }
    saveCollapseState();
}


// -------------------- 5. チェックボックスの状態変更処理 --------------------
function handleCheckboxChange(event) {
    const id = event.target.dataset.id;
    achievementState[id] = event.target.checked;
    
    saveState();
    updateProgress();
}

// -------------------- 6. 進捗の計算と表示更新 --------------------
function updateProgress() {
    let overallCompleted = 0;
    let overallTotal = 0;

    achievementsData.forEach(categoryData => {
        let categoryCompleted = 0;
        const categoryID = categoryData.category.replace(/\s/g, '-');
        const categoryTotal = categoryData.items.length;
        overallTotal += categoryTotal;

        categoryData.items.forEach(item => {
            if (achievementState[item.id]) {
                categoryCompleted++;
            }
        });

        overallCompleted += categoryCompleted;

        // カテゴリごとの進捗表示を更新
        const categoryProgressElement = document.getElementById(`progress-${categoryID}`);
        if (categoryProgressElement) {
            categoryProgressElement.textContent = `${categoryCompleted}/${categoryTotal}`;
        }
    });

    // 全体進捗の計算と表示
    const overallPercentage = overallTotal > 0 ? (overallCompleted / overallTotal) * 100 : 0;

    document.getElementById('overall-count').textContent = `${overallCompleted}/${overallTotal}`;
    document.getElementById('overall-percentage').textContent = `${overallPercentage.toFixed(1)}%`;
    document.getElementById('overall-percentage-bar').style.width = `${overallPercentage}%`;
}


// -------------------- 7. 初期化 --------------------
document.addEventListener('DOMContentLoaded', () => {
    loadState(); // 状態と開閉状態を読み込む
    renderAchievements(); // 実績リストを生成し、状態を反映
    updateProgress(); // 進捗を計算し表示
});