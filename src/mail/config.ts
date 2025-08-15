export const handleHtmlMail = (code: number) => `<!DOCTYPE html>
<html>
  <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f7f7f7; padding: 32px;">
    <div style="max-width: 420px; margin: auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #eee; padding: 32px;">
      <h2 style="color: #2d8cf0; margin-bottom: 8px;">ToDo清单 · 验证码来啦！</h2>
      <p style="font-size: 16px; color: #333;">Hi，任务达人！</p>
      <p style="font-size: 16px; color: #333;">您的专属验证码是：</p>
      <div style="font-size: 32px; font-weight: bold; color: #2d8cf0; letter-spacing: 8px; margin: 16px 0;">
        ${code}
      </div>
      <p style="color: #888;">请在 <b>10分钟</b> 内输入验证码，开启高效生活新一天！</p>
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
      <p style="font-size: 13px; color: #aaa;">（别让验证码也变成“待办事项”哦~）</p>
      <p style="font-size: 12px; color: #bbb; text-align: right;">ToDo清单团队</p>
    </div>
  </body>
</html>`;
