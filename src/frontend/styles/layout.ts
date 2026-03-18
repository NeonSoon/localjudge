export const layout = `

    #mainView, #loginView {
        width: 100%;
        height: 100vh;
        display: flex;
        flex-direction: column;
        
        justify-content: center;
        align-items: center;
        
        gap: 20px;
    }
        
    /* 首頁 標題、副標題 */
    #mainView h1 {
        font-size: 36px;
        margin: 0;
        font-weight: 650;
    }
    #mainView p {
        margin: 0;
        color: #9ca3af;
        line-height: 1.4;
    }

    /* 登入卡片 */
    .card {
        width: 100%;
        max-width: 520px;
        padding: 28px;
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,0.12);
        background: rgba(17,17,17,0.95);
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    /* input */
    input {
        padding: 12px;
        border-radius: 999px;
        border: none;
        font-size: 16px;
    }

    /* 按鈕都是整條的 */
    .fullBtn {
        width: 100%;
        padding: 14px 0;
        border-radius: 12px;
        border: none;
        cursor: pointer;
        transition: 0.15s ease;
    }

    .homefullBtn {
        width: 240px;
        padding: 14px 0;
        border-radius: 12px;
        border: none;
        cursor: pointer;
        transition: 0.15s ease;
    }

    /* 首頁按鈕 */
    .homeLoginBtn {
        padding: 12px;
        border-radius: 999px;
        width: 480px;
        font-size: 16px;
    }
    .homeLoginBtn:hover { background: #c5c3c3; }
        
    /* 按鈕 */
    .manualBtn {
        padding: 12px;
        border-radius: 999px;
        font-size: 16px;
    }
   .manualBtn:hover { background: #a9a7a7; }

    .portalBtn { 
        background: #7da2d6; 
        color: white;
        font-size: 16px;
    }
    .portalBtn:hover { background: #718fcb; }

    .divider { text-align: center; }

    .logo{
        display: flex;
        justify-content: center;
        margin-bottom: 10px;
    }

`;