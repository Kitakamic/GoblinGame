/**
 * 文生图服务
 * 负责通过酒馆助手的文生图接口生成图片
 */

const EventType = {
  GENERATE_IMAGE_REQUEST: 'generate-image-request',
  GENERATE_IMAGE_RESPONSE: 'generate-image-response',
};

export interface GenerateImageRequest {
  id: string;
  prompt: string;
  width?: number | null;
  height?: number | null;
}

export interface GenerateImageResponse {
  id: string;
  success: boolean;
  imageData?: string; // base64图片数据
  error?: string;
  prompt?: string;
  change?: string;
}

/**
 * 生成图片
 * @param prompt 提示词
 * @param width 图片宽度（可选）
 * @param height 图片高度（可选）
 * @param timeoutMs 超时时间（毫秒），默认120秒
 * @returns Promise<string> 返回base64图片数据，如果失败则抛出错误
 */
export async function generateImage(
  prompt: string,
  width: number | null = null,
  height: number | null = null,
  timeoutMs: number = 120000, // 默认120秒（2分钟）
): Promise<string> {
  // 生成唯一请求ID
  const requestId = `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return new Promise<string>((resolve, reject) => {
    // 设置超时时间
    const timeout = setTimeout(() => {
      eventRemoveListener(EventType.GENERATE_IMAGE_RESPONSE, imageResponseHandler);
      const timeoutSeconds = Math.round(timeoutMs / 1000);
      reject(
        new Error(
          `文生图请求超时（${timeoutSeconds}秒），图片生成可能需要更长时间，请稍后重试或检查文生图接口是否正常工作`,
        ),
      );
    }, timeoutMs);

    // 响应处理器
    const imageResponseHandler = (responseData: GenerateImageResponse) => {
      if (responseData.id !== requestId) return; // id不一样，不是这次请求的响应

      clearTimeout(timeout);
      eventRemoveListener(EventType.GENERATE_IMAGE_RESPONSE, imageResponseHandler); // 取消监听

      if (responseData.success && responseData.imageData) {
        // 如果返回的是base64数据，确保包含data:image前缀
        let imageData = responseData.imageData;
        if (!imageData.startsWith('data:')) {
          imageData = `data:image/png;base64,${imageData}`;
        }
        resolve(imageData);
      } else {
        reject(new Error(responseData.error || '文生图失败：未知错误'));
      }
    };

    // 开启监听
    eventOn(EventType.GENERATE_IMAGE_RESPONSE, imageResponseHandler);

    // 发送请求
    const requestData: GenerateImageRequest = {
      id: requestId,
      prompt,
      width,
      height,
    };

    eventEmit(EventType.GENERATE_IMAGE_REQUEST, requestData);
  });
}
