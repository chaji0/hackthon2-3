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
  getDoc,
  setDoc,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

// Firebase 설정 정보
const firebaseConfig = {
  apiKey: "AIzaSyCAct_w0WE8OSajSgMRGpAFc6oSQD2HkbU",
  authDomain: "hackthon-a6c6d.firebaseapp.com",
  projectId: "hackthon-a6c6d",
  storageBucket: "hackthon-a6c6d.firebasestorage.app",
  messagingSenderId: "189149246215",
  appId: "1:189149246215:web:7e9cc7ca5f3d6732e10ba2"
};

// Firebase 초기화 및 서비스 연결
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 현재 로그인한 사용자 정보 및 역할 (null이면 로그아웃 상태)
let currentUser = null;
let currentUserRole = "student"; // 기본값 student, 'teacher' 또는 'student'

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
  // 로그인이 되어 있어야 작성 가능
  if (!currentUser) {
    alert("메모를 작성하려면 먼저 Google 로그인을 해주세요.");
    return;
  }

  // 5글자 이상일 때만 Firestore에 저장
  if (!text || text.trim().length < 5) {
    alert("메모는 5글자 이상 입력해 주세요.");
    return;
  }

  try {
    await addDoc(collection(db, "memos"), {
      text: text,
      createdAt: Date.now(),
      uid: currentUser.uid,
      authorName: currentUser.displayName || "익명"
    });
  } catch (error) {
    console.error("메모 추가 실패:", error);
    alert("메모 저장 중 오류가 발생했습니다.");
  }
}

// 메모를 지웁니다.
// 교사는 모든 메모를 지울 수 있고, 학생은 본인이 작성한 메모만 지울 수 있습니다.
async function deleteMemo(id) {
  if (!currentUser) {
    alert("삭제 권한이 없습니다. 로그인이 필요합니다.");
    return;
  }

  const memo = memos.find(function (m) {
    return m.id === id;
  });

  if (!memo) return;

  // 학생인 경우 본인 메모인지 확인
  if (currentUserRole !== "teacher" && memo.uid !== currentUser.uid) {
    alert("다른 사람의 메모는 삭제할 수 없습니다.");
    return;
  }

  try {
    await deleteDoc(doc(db, "memos", id));
  } catch (error) {
    console.error("메모 삭제 실패:", error);
    alert("메모 삭제 중 오류가 발생했습니다.");
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

  // 삭제 버튼: 교사이거나 본인이 작성한 메모일 때만 표시
  const canDelete = currentUser && (currentUserRole === "teacher" || memo.uid === currentUser.uid);
  if (canDelete) {
    const del = document.createElement("button");
    del.textContent = "×";
    del.title = "삭제";
    del.addEventListener("click", function () {
      deleteMemo(memo.id);
    });
    div.appendChild(del);
  }

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

    if (text.length < 5) {
      alert("메모는 5글자 이상 입력해 주세요.");
      return;
    }

    addMemo(text);
    input.value = "";
  }
});


// ===================================================
// 구글 로그인 / 로그아웃 기능
// ===================================================

const userArea = document.getElementById("userArea");

// 사용자 상태에 따른 상단 로그인 영역 렌더링
function renderUserArea() {
  userArea.innerHTML = "";

  if (currentUser) {
    const roleLabel = currentUserRole === "teacher" ? " [선생님]" : " [학생]";
    const welcome = document.createElement("span");
    welcome.textContent = `${currentUser.displayName || "사용자"}님${roleLabel} 환영합니다! `;
    userArea.appendChild(welcome);

    const logoutBtn = document.createElement("button");
    logoutBtn.textContent = "로그아웃";
    logoutBtn.addEventListener("click", async function () {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("로그아웃 실패:", error);
      }
    });
    userArea.appendChild(logoutBtn);
  } else {
    const loginBtn = document.createElement("button");
    loginBtn.textContent = "Google 계정으로 로그인";
    loginBtn.addEventListener("click", async function () {
      try {
        await signInWithPopup(auth, provider);
      } catch (error) {
        console.error("구글 로그인 실패 상세:", error);
        if (error.code === "auth/unauthorized-domain") {
          alert("Firebase 콘솔의 Authentication > Settings > 승인된 도메인에 현재 접속 주소(127.0.0.1 또는 localhost)를 추가해 주세요.");
        } else if (error.code === "auth/popup-closed-by-user") {
          // 사용자가 팝업을 닫은 경우는 무시하거나 가볍게 안내
          console.log("로그인 팝업이 닫혔습니다.");
        } else {
          alert(`로그인 중 오류가 발생했습니다.\n[${error.code}] ${error.message}`);
        }
      }
    });
    userArea.appendChild(loginBtn);
  }
}

// 사용자 역할(teacher / student) 불러오기
async function loadUserRole(user) {
  if (!user) {
    currentUserRole = "student";
    return;
  }

  try {
    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      currentUserRole = userSnap.data().role || "student";
    } else {
      // 기본값은 student 로 등록
      currentUserRole = "student";
      await setDoc(userDocRef, {
        role: "student",
        name: user.displayName || "익명",
        createdAt: Date.now()
      });
    }
  } catch (error) {
    console.warn("사용자 역할 조회 실패(기본값 student 적용):", error);
    currentUserRole = "student";
  }
}

// 인증 상태 변화 감지 (로그인 / 로그아웃 시 자동 실행)
onAuthStateChanged(auth, async function (user) {
  currentUser = user;
  if (user) {
    await loadUserRole(user);
  } else {
    currentUserRole = "student";
  }
  renderUserArea();
  render(); // 권한에 따른 삭제 버튼 노출 갱신
});


// ===================================================
// Firestore 실시간 동기화
// 데이터가 추가되거나 삭제되면 자동으로 화면을 다시 그립니다.
// ===================================================

const q = query(collection(db, "memos"), orderBy("createdAt", "asc"));
onSnapshot(q, function (snapshot) {
  memos = [];
  snapshot.forEach(function (docSnap) {
    const data = docSnap.data();
    memos.push({
      id: docSnap.id,
      text: data.text,
      createdAt: data.createdAt,
      uid: data.uid,
      authorName: data.authorName
    });
  });
  render();
});

input.focus();
