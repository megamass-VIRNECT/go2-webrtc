import { Go2WebRTC } from "./go2webrtc_remote.js";

// Function to log messages to the console and the log window
function logMessage(text) {
  var log = document.querySelector("#log");
  var msg = document.getElementById("log-code");
  msg.textContent += truncateString(text, 300) + "\n";
  log.scrollTop = log.scrollHeight;
}
globalThis.logMessage = logMessage;

// Function to load saved values from localStorage
function loadSavedValues() {
  const savedSignallingServer = localStorage.getItem("signallingServer");
  const savedTurnServer = localStorage.getItem("turnServer");
  const savedIceTransportPolicy = localStorage.getItem("iceTransportPolicy");

  if (savedSignallingServer) {
    document.getElementById("signalling-server").value = savedSignallingServer;
  }

  if (savedTurnServer) {
    document.getElementById("turn-server").value = savedTurnServer;
  }

  if (savedIceTransportPolicy) {
    document.getElementById("ice-transport-policy").value = savedIceTransportPolicy;
  }

  const commandSelect = document.getElementById("command");
  Object.entries(SPORT_CMD).forEach(([value, text]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text;
    commandSelect.appendChild(option);
  });
}

// Function to handle connect button click
function handleConnectClick() {
  // You can add connection logic here
  // For now, let's just log the values
  const signallingServer = document.getElementById("signalling-server").value;
  const turnServer = document.getElementById("turn-server").value;
  const iceTransportPolicy = document.getElementById("ice-transport-policy").value;
  console.log("Turn Server:", turnServer);
  logMessage(`Connecting to robot...`);

  // Save the values to localStorage
  localStorage.setItem("signallingServer", signallingServer);
  localStorage.setItem("turnServer", turnServer);
  localStorage.setItem("iceTransportPolicy", iceTransportPolicy);

  // Initialize RTC
  globalThis.rtc = new Go2WebRTC(signallingServer, turnServer, iceTransportPolicy);

  // Initialize RTC
  // fetch("webrtc_config.json")
  //   .then(response => {
  //       if (!response.ok) throw new Error("Config file not found");
  //       return response.json();
  //   })
  //   .then(config => {
  //       globalThis.rtc = new Go2WebRTC(config.email, config.password, config.sn);
  //       // globalThis.rtc.initSDP();
  //   })
  //   .catch(error => {
  //       console.error("Failed to load WebRTC config:", error);
  //       alert("WebRTC 설정 파일을 불러올 수 없습니다.");
  //   });
}

function handleExecuteClick() {
  const uniqID =
    (new Date().valueOf() % 2147483648) + Math.floor(Math.random() * 1e3);
  const command = parseInt(document.getElementById("command").value);

  console.log("Command:", command);

  globalThis.rtc.publish("rt/api/sport/request", {
    header: { identity: { id: uniqID, api_id: command } },
    parameter: JSON.stringify(command),
    // api_id: command,
  });
}


function handleExecuteCustomClick() {
    const command = document.getElementById("custom-command").value;
  
    console.log("Command:", command);
  
    globalThis.rtc.channel.send(command);
  }

function truncateString(str, maxLength) {
  if (typeof str !== "string") {
    str = JSON.stringify(str);
  }

  if (str.length > maxLength) {
    return str.substring(0, maxLength) + "...";
  } else {
    return str;
  }
}

function applyGamePadDeadzeone(value, th) {
  return Math.abs(value) > th ? value : 0
}

function joystickTick(joyLeft, joyRight) {
  let x,y,z = 0;
  let gpToUse = document.getElementById("gamepad").value;
  if (gpToUse !== "NO") {
    const gamepads = navigator.getGamepads();
    let gp = gamepads[gpToUse];
    
    // LB must be pressed
    if (gp.buttons[4].pressed == true) {
      const speedScale = 1;
      x = -1 * applyGamePadDeadzeone(gp.axes[1], 0.25) * speedScale;
      y = -1 * applyGamePadDeadzeone(gp.axes[2], 0.25) * speedScale;
      z = -1 * applyGamePadDeadzeone(gp.axes[0], 0.25) * speedScale;
    } 
  } else {
     const joystickScale = 100; // 값을 키울수록 움직임이 느려짐
     y = -1 * (joyRight.GetPosX() - 100) / joystickScale;
     x = -1 * (joyLeft.GetPosY() - 100) / joystickScale;
     z = -1 * (joyLeft.GetPosX() - 100) / joystickScale;
  }

  if (x === 0 && y === 0 && z === 0) {
    return;
  }

  if (x == undefined || y == undefined || z == undefined) {
    return;
  }

  console.log("Joystick Linear:", x, y, z);

  if(globalThis.rtc == undefined) return;
  globalThis.rtc.publishApi("rt/api/sport/request", 1008, JSON.stringify({x: x, y: y, z: z}));
}

function addJoysticks() {
  const joyConfig = {
    internalFillColor: "#FFFFFF",
    internalLineWidth: 2,
    internalStrokeColor: "rgba(240, 240, 240, 0.3)",
    externalLineWidth: 1,
    externalStrokeColor: "#FFFFFF",
  };
  var joyLeft = new JoyStick("joy-left", joyConfig);
  var joyRight = new JoyStick("joy-right", joyConfig);

  setInterval( joystickTick, 100, joyLeft, joyRight );
}

const buildGamePadsSelect = (e) => {
  const gp = navigator.getGamepads().filter(x => x != null && x.id.toLowerCase().indexOf("xbox") != -1);

  const gamepadSelect = document.getElementById("gamepad");
  gamepadSelect.innerHTML = "";

  const option = document.createElement("option");
  option.value = "NO";
  option.textContent = "Don't use Gamepad"
  option.selected = true;
  gamepadSelect.appendChild(option);  

  Object.entries(gp).forEach(([index, value]) => {
    if (!value) return
    const option = document.createElement("option");
    option.value = value.index;
    option.textContent = value.id;
    gamepadSelect.appendChild(option);
  });
};

window.addEventListener("gamepadconnected", buildGamePadsSelect);
window.addEventListener("gamepaddisconnected", buildGamePadsSelect);
buildGamePadsSelect();

// Load saved values when the page loads
document.addEventListener("DOMContentLoaded", loadSavedValues);
document.addEventListener("DOMContentLoaded", addJoysticks);

document.getElementById("gamepad").addEventListener("change", () => {
//alert("change");
});

// Attach event listener to connect button
document
  .getElementById("connect-btn")
  .addEventListener("click", handleConnectClick);

document
  .getElementById("execute-btn")
  .addEventListener("click", handleExecuteClick);

document
  .getElementById("execute-custom-btn")
  .addEventListener("click", handleExecuteCustomClick);




  document.addEventListener('keydown', function(event) {
    const key = event.key.toLowerCase();
    let x = 0, y = 0, z = 0;

    switch (key) {
        case 'w': // Forward
            x = 0.8;
            break;
        case 's': // Reverse
            x = -0.4;
            break;
        case 'a': // Sideways left
            y = 0.4;
            break;
        case 'd': // Sideways right
            y = -0.4;
            break;
        case 'q': // Turn left
            z = 2;
            break;
        case 'e': // Turn right
            z = -2;
            break;
        default:
            return; // Ignore other keys
    }

    if(globalThis.rtc !== undefined) {
        globalThis.rtc.publishApi("rt/api/sport/request", 1008, JSON.stringify({x: x, y: y, z: z}));
    }
});

document.addEventListener('keyup', function(event) {
    const key = event.key.toLowerCase();
    if (key === 'w' || key === 's' || key === 'a' || key === 'd' || key === 'q' || key === 'e') {
        if(globalThis.rtc !== undefined) {
            // Stop movement by sending zero velocity
            globalThis.rtc.publishApi("rt/api/sport/request", 1008, JSON.stringify({x: 0, y: 0, z: 0}));
        }
    }
});

