import FormData from 'form-data';
import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	//IRequestOptions,
	NodeConnectionType,
	//IDataObject,
	//NodeOperationError,
	IHttpRequestOptions,
	BINARY_ENCODING
} from 'n8n-workflow';


export class Aryn implements INodeType {
	description: INodeTypeDescription = {
		// Basic node details will go here
		displayName: 'Aryn',
		name: 'aryn',
		icon: 'file:ArynCircleLogo.svg',
		group: ['transform'],
		version: 0,
		subtitle: '={{ $parameter["operation"] }}',
		description: 'Consume Aryn API',
		defaults: {
			name: 'Aryn',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'arynApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://api.aryn.ai',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{
						name: 'Parse Document',
						value: 'parse',
						description: 'Parse a document into structured data',
						action: 'Parse a document',
					},
				],
				default: 'parse',
				noDataExpression: true,
			},
			{
				displayName: 'Input Binary Field',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				placeholder: 'e.g data',
				hint: 'The name of the input binary field containing the file to be extracted',
			},
			{
				displayName: "Text mode",
				name: "textMode",
				type: "options",
				default: "auto",
				noDataExpression: true,
				options: [
					{
						name: "Auto",
						value: "auto",
						description: "Let Aryn decide the best text extraction method",
						action: "auto"
					},
					{
						name: "Inline",
						value: "inline_fallback_to_ocr",
						description: "Let Aryn decide the best text extraction method",
						action: "inline_fallback_to_ocr"
					},
					{
						name: "OCR Standard",
						value: "ocr_standard",
						description: "Use Optical Character Recognition to extract text",
						action: "ocr_standard"
					},
					{
						name: "OCR Vision",
						value: "ocr_vision",
						description: "Use a vision language model to augment OCR extraction",
						action: "ocr_vision"
					}
				],
			}
		]
	};
	// The execute method will go here
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		// Handle data coming from previous nodes
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;
		let responseData;

		const textMode = this.getNodeParameter('textMode', 0) as string;
		// For each item, make an API call to create a contact
		for (let i = 0; i < items.length; i++) {
			const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
			const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);

			let buffer: Buffer;
			if (binaryData.id) {
				const stream = await this.helpers.getBinaryStream(binaryData.id);
				buffer = await this.helpers.binaryToBuffer(stream);
			} else {
				buffer = Buffer.from(binaryData.data, BINARY_ENCODING);
			}

			const formData = new FormData();
			formData.append('file', buffer, {
				filename: binaryData.fileName,
				contentType: binaryData.mimeType,
			});
			formData.append('options', JSON.stringify({ text_mode: textMode }));
			this.logger.info(`Form Data: ${JSON.stringify(formData)}`);
			if (operation === 'parse') {
				// Make HTTP request
				const options: IHttpRequestOptions = {
					headers: {
						'Accept': 'application/json',
						'source': 'n8n',
					},
					method: 'POST',
					body: formData,
					url: `https://api.aryn.ai/v1/document/partition`,
					json: true,

				};
				responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'arynApi', options);
				returnData.push(responseData);
			}
		}
		// Map data to n8n data structure
		return [this.helpers.returnJsonArray(returnData)];
	}
}
