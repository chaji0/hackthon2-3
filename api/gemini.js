// ===================================================
// Gemini API 호출을 위한 Vercel 서버리스 함수 (/api/gemini)
//
// 무료 티어로 사용 가능한 gemini-2.0-flash 모델을 호출합니다.
// ===================================================

export default async function handler(req, res) {
  // POST 요청만 허용
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "메모 내용이 전달되지 않았습니다." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY 환경변수가 설정되지 않았습니다. Vercel 환경변수에 추가해 주세요."
    });
  }

  try {
    const prompt = `당신은 친절하고 격려를 아끼지 않는 초등학교/중학교 선생님의 인공지능 도우미입니다.
학생이 학급 담벼락에 남긴 다음 메모 글을 읽고, 학생에게 힘이 되고 배움을 칭찬해주는 따뜻한 1~2문장의 코멘트를 남겨주세요.
학생의 개인정보나 식별 정보는 일체 포함하지 마세요.

학생 메모: "${text}"`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      return res.status(response.status).json({
        error: errData.error?.message || "Gemini API 호출 실패"
      });
    }

    const data = await response.json();
    const comment = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "좋은 생각이에요! 계속 응원할게요.";

    return res.status(200).json({ comment });
  } catch (error) {
    console.error("Gemini API 처리 중 오류:", error);
    return res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
}
