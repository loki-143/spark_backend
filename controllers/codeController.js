const axios = require("axios");

exports.runCode = async (req, res) => {
  const { source_code, language_id, stdin } = req.body;
  console.log("Received request:", req.body);

  try {
    // Step 1: Base64 encode source code and stdin
    const encodedCode = Buffer.from(source_code).toString("base64");
    const encodedInput = Buffer.from(stdin || "").toString("base64");

    // Step 2: Submit code to Judge0
    const submissionRes = await axios.post(
      "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=false&fields=*",
      {
        language_id: language_id,
        source_code: encodedCode,
        stdin: encodedInput,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
      }
    );

    const token = submissionRes.data.token;

    // Step 3: Poll for result
    let result;
    for (let i = 0; i < 10; i++) {
      const pollRes = await axios.get(
        `https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=true&fields=*`,
        {
          headers: {
            "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
        }
      );

      const status = pollRes.data.status?.description;
      if (status === "In Queue" || status === "Processing") {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        result = pollRes.data;
        break;
      }
    }

    if (!result) {
      return res.status(408).json({ error: "Timeout or no result." });
    }

    // Step 4: Decode output
    const decodedOutput = result.stdout
      ? Buffer.from(result.stdout, "base64").toString("utf-8")
      : "";
    const decodedError = result.stderr
      ? Buffer.from(result.stderr, "base64").toString("utf-8")
      : "";
    const decodedCompileOutput = result.compile_output
      ? Buffer.from(result.compile_output, "base64").toString("utf-8")
      : "";

    res.json({
      status: result.status?.description,
      output: decodedOutput,
      stderr: decodedError,
      compile_output: decodedCompileOutput,
    });
  } catch (err) {
    console.error("Execution error:", err.message);
    res.status(500).json({ error: "Code execution failed." });
  }
};
