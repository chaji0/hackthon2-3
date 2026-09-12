// ===================================================
// 우리 반 담벼락 - 시작점
//
// 메모를 쓰면 올린 순서대로 담벼락에 붙습니다.
// 지금은 데이터가 아래 배열에만 들어 있어서,
// 브라우저를 새로고침하면 전부 사라집니다.
// ===================================================


// --- Firebase 모듈 불러오기 ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// Firebase 설정 정보
const firebaseConfig = {
  apiKey: "AIzaSyCAct_w0WE8OSajSgMRGpAFc6oSQD2HkbU",
  authDomain: "hackthon-a6c6d.firebaseapp.com",
  projectId: "hackthon-a6c6d",
  storageBucket: "hackthon-a6c6d.firebasestorage.app",
  messagingSenderId: "189149246215",
  appId: "1:189149246215:web:7e9cc7ca5f3d6732e10ba2"
};

// Firebase 초기화 및 Firestore 데이터베이스 연결
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 메모 목록 (Firestore와 실시간 동기화) ---
let memos = [];


// ===================================================
// 데이터를 다루는 함수 세 개
// Firestore 데이터베이스와 통신합니다.
// ===================================================

// 메모를 읽어 옵니다.
function loadMemos() {
  return memos.slice().sort(function (a, b) {
    return a.createdAt - b.createdAt;
  });
}

// 메모를 새로 씁니다.
// 백엔드 2: 여기에 "누가 썼는지"(uid)를 함께 저장하게 됩니다.
async function addMemo(text) {
  try {
    await addDoc(collection(db, "memos"), {
      text: text,
      createdAt: Date.now()
    });
  } catch (error) {
    console.error("메모 추가 실패:", error);
  }
}

// 메모를 지웁니다.
// 백엔드 2: 지금은 누구든 남의 메모를 지울 수 있습니다. 이걸 막는 것이 과제입니다.
async function deleteMemo(id) {
  try {
    await deleteDoc(doc(db, "memos", id));
  } catch (error) {
    console.error("메모 삭제 실패:", error);
  }
}


// ===================================================
// 화면 그리기
// ===================================================

function render() {
  const wall = document.getElementById("wall");
  wall.innerHTML = "";

  loadMemos().forEach(function (memo) {
    wall.appendChild(makeMemo(memo));
  });
}

// 메모 한 장 만들기
function makeMemo(memo) {
  const div = document.createElement("div");
  div.className = "memo";

  const del = document.createElement("button");
  del.textContent = "×";
  del.addEventListener("click", function () {
    deleteMemo(memo.id);
  });
  div.appendChild(del);

  const span = document.createElement("span");
  span.textContent = memo.text;
  div.appendChild(span);

  return div;
}


// ===================================================
// 메모 쓰는 칸
// 엔터를 누르면 담벼락에 붙습니다 (줄바꿈은 Shift + 엔터)
// ===================================================

const input = document.getElementById("input");

input.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();

    const text = input.value.trim();
    if (text === "") return;

    addMemo(text);
    input.value = "";
  }
});


// ===================================================
// Firestore 실시간 동기화
// 데이터가 추가되거나 삭제되면 자동으로 화면을 다시 그립니다.
// ===================================================

const q = query(collection(db, "memos"), orderBy("createdAt", "asc"));
onSnapshot(q, function (snapshot) {
  memos = [];
  snapshot.forEach(function (docSnap) {
    memos.push({
      id: docSnap.id,
      text: docSnap.data().text,
      createdAt: docSnap.data().createdAt
    });
  });
  render();
});

input.focus();
