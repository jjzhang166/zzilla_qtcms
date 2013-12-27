#include "StreamProcess.h"
#include <QDateTime>
#include <QtEndian>
#include <QDomDocument>
#include "h264wh.h"
#include "IDeviceConnection.h"
#include <QtCore/QTime>


StreamProcess::StreamProcess():
m_nRemainBytes(0),
m_nTotalBytes(0),
m_bIsHead(true),
m_nPort(80),
m_bIsSupportBubble(true),
m_bStop(false),
m_bIsPreview(false),
m_nVerifyResult(0),
m_tcpSocket(NULL)
{
}

StreamProcess::~StreamProcess(void)
{
	if ( NULL != m_tcpSocket)
	{
		delete m_tcpSocket;
        m_tcpSocket = NULL;
	}
}

int  StreamProcess::getSocketState()
{
	if (NULL == m_tcpSocket)
	{
		return 0;
	}

    int nStatus = m_tcpSocket->state();
    int nRet = 0;
    if (QAbstractSocket::ConnectingState == nStatus)
    {
        nRet = IDeviceConnection::CS_Connectting;
    }
    else if (QAbstractSocket::ConnectedState == nStatus)
    {
        nRet = IDeviceConnection::CS_Connected;
    }
    else if (QAbstractSocket::ClosingState == nStatus)
    {
        nRet = IDeviceConnection::CS_Disconnecting;
    }
    else if (QAbstractSocket::UnconnectedState == nStatus)
    {
        nRet = IDeviceConnection::CS_Disconnected;
    }
    else
    {
        //nothing
    }
    return nRet;
}

void StreamProcess::setAddressInfo(QHostAddress hostAddress, int port)
{
	m_hostAddress = hostAddress;
	m_nPort = port;
}

void StreamProcess::setEventMap(QStringList eventList, QMultiMap<QString, ProcInfoItem> eventMap)
{
	m_eventList = eventList;
	m_eventMap = eventMap;
}

void StreamProcess::setPreview()
{
	m_bIsPreview = true;
}

void StreamProcess::conToHost(QString hostAddr, quint16 ui16Port )
{
	if ( NULL == m_tcpSocket )
	{
		m_tcpSocket = new QTcpSocket;
	}

    m_tcpSocket->abort();
	
	connect(m_tcpSocket, SIGNAL(readyRead()), this, SLOT(receiveStream()));
	connect(m_tcpSocket, SIGNAL(error(QAbstractSocket::SocketError)), this, SLOT(showError(QAbstractSocket::SocketError)));
	connect(m_tcpSocket, SIGNAL(stateChanged(QAbstractSocket::SocketState)), this, SLOT(stateChanged(QAbstractSocket::SocketState)));

    m_tcpSocket->connectToHost(hostAddr, ui16Port);
    if (m_tcpSocket->waitForConnected(500))
    {
		m_nRemainBytes = 0;
		m_nTotalBytes = 0;
		m_bIsHead = true;
		m_bStop = false;
		m_bIsPreview = false;
		m_nPort = 80;
		m_nVerifyResult = 0;
    }
}


void StreamProcess::stopStream()
{
	if (NULL != m_tcpSocket)
	{
		m_bStop = true;

		disconnect(m_tcpSocket, SIGNAL(readyRead()), this, SLOT(receiveStream()));
		disconnect(m_tcpSocket, SIGNAL(error(QAbstractSocket::SocketError)), this, SLOT(showError(QAbstractSocket::SocketError)));
		disconnect(m_tcpSocket, SIGNAL(stateChanged(QAbstractSocket::SocketState)), this, SLOT(stateChanged(QAbstractSocket::SocketState)));

		m_tcpSocket->disconnectFromHost();
	}
}

void StreamProcess::socketWrites(QByteArray block)
{
	if (NULL != m_tcpSocket && QAbstractSocket::ConnectedState == m_tcpSocket->state())
	{
        m_tcpSocket->write(block);
        if (!m_tcpSocket->waitForBytesWritten(300))
        {
            qDebug()<<"socket write failure:\t"<<__FUNCTION__<<__LINE__;
        }
	}
	else if (NULL != m_tcpSocket && QAbstractSocket::ConnectedState != m_tcpSocket->state())
	{
		m_tcpSocket->abort();
        int times = 0;
        while (m_tcpSocket->state() != QAbstractSocket::ConnectedState && times < 3)
        {
            ++times;
            m_tcpSocket->connectToHost(m_hostAddress, m_nPort);
            if (m_tcpSocket->waitForConnected(300))
            {
                m_tcpSocket->write(block);
                if (!m_tcpSocket->waitForBytesWritten(300))
                {
                    qDebug()<<"socket write failure:\t"<<__FUNCTION__<<__LINE__;
                }
            }
        }
		
    }
}
QString StreamProcess::checkXML(QString source)
{
	int i = 0;
	int nPos = source.lastIndexOf(QString("vin%1").arg(i));
	while(nPos != -1)
	{
		if (! source.mid(--nPos,1).contains('/'))
		{
			source.insert(++nPos, '/');
		} 
		++i;
		nPos = source.lastIndexOf(QString("vin%1").arg(i));    
	}
	return source;
}

void StreamProcess::analyzeBubbleInfo()
{
	int pos = m_buffer.indexOf("<");
	QString xml = m_buffer.mid(pos, m_buffer.indexOf("#") - pos);


	QString temp = xml;
	xml = checkXML(temp);

	QDomDocument *dom = new QDomDocument();
	if(NULL == dom || !dom->setContent(xml))
	{
		delete dom;
		dom = NULL;
		return;
	}

	QDomNode root = dom->firstChild();
	int uiChannelCount = root.toElement().attribute("vin").toInt();

	for (int i = 0; i < uiChannelCount; i++)
	{
		QList<Stream> list;
		QString tagName = QString("vin%1").arg(i);
		QDomNodeList nodelist = dom->elementsByTagName(tagName);
		QDomNode subnode = nodelist.at(0);
		int StreamNum = subnode.toElement().attribute("stream").toInt();

		for (int j = 0; j < StreamNum; j++)
		{
			QString name = QString("stream%1").arg(j);
			QDomNodeList nodelist1 = dom->elementsByTagName(name);
			QDomNode node =  nodelist1.at(0);
			Stream stem;
			stem.sName = node.toElement().attribute("name");
			stem.sSize = node.toElement().attribute("size");
			stem.sx1 = node.toElement().attribute("x1");
			stem.sx2 = node.toElement().attribute("x2");
			stem.sx4 = node.toElement().attribute("x4");

			list.append(stem);
		}
		m_lstStreamList.append(list);
	}
}



void StreamProcess::receiveStream()
{
	Bubble *pBubble = NULL;

	if (m_bStop)
	{
		m_buffer.clear();
		return;
	}

	if (m_tcpSocket->bytesAvailable() > 0)
	{
		m_buffer += m_tcpSocket->readAll();
		if (m_buffer.contains("HTTP/1.1 200") && m_buffer.size() >= 1024)
		{
			if (m_bIsPreview)
			{
				analyzeBubbleInfo();
				g_verify.wakeOne();
			}
			m_buffer.remove(0, 1024);
		}
		else if(m_buffer.contains("HTTP/1.1 404"))
		{
			m_tcpSocket->disconnectFromHost();
			m_bIsSupportBubble = false;
			m_buffer.clear();
		}
		else if (m_buffer.startsWith("\xab") && m_buffer.size() > 5)
		{
			pBubble = (Bubble *)m_buffer.data();
			m_nTotalBytes = qToBigEndian(pBubble->uiLength) + sizeof(pBubble->cHead) + sizeof(pBubble->uiLength);
			if (m_buffer.size() >= m_nTotalBytes)
			{
				analyzeRecordStream();
			}
		}
		else if (m_buffer.startsWith("\xaa") && m_buffer.size() > 5)
		{
			pBubble = (Bubble *)m_buffer.data();
			m_nTotalBytes = qToBigEndian(pBubble->uiLength) + sizeof(pBubble->cHead) + sizeof(pBubble->uiLength);
			if (m_buffer.size() >= m_nTotalBytes)
			{
				analyzePreviewStream();
			}
		}
	}
}



void StreamProcess::analyzePreviewStream()
{
	Bubble *pBubble = NULL;
	Message *pMsg = NULL;
	AuthorityBack *pAutoBack = NULL;
	LiveStream *liveStreamInfo = NULL;

	while(m_buffer.size() >= m_nTotalBytes)
	{
		char *dataArr = new char[m_nTotalBytes];

		memset(dataArr, 0, m_nTotalBytes);
		memcpy(dataArr, m_buffer.data(), m_nTotalBytes);

		pBubble = (Bubble *)dataArr;

		//verify reback
		if ('\x00' == pBubble->cCmd)
		{
			pMsg = (Message *)(m_buffer.data() + 10);
			if ('\x03' == pMsg->cMessage)
			{
				pAutoBack = (AuthorityBack *)pMsg->pParameters;
				m_nVerifyResult = (int)pAutoBack->cVerified;
				g_verify.wakeOne();
			}
			m_buffer.remove(0, m_nTotalBytes);
		}
		else if ('\x01' == pBubble->cCmd)//preview stream
		{
			liveStreamInfo = (LiveStream *)pBubble->pLoad;

			QVariantMap mStreamInfo;

			//��Ƶ
			if (0 == liveStreamInfo->cType)
			{
				LiveStreamAudio *audioStream = (LiveStreamAudio*)(liveStreamInfo->pData);

				mStreamInfo.insert("channel", liveStreamInfo->cChannel);
				mStreamInfo.insert("pts", audioStream->ui64Pts);
				mStreamInfo.insert("length", qToBigEndian(liveStreamInfo->uiLength));
				mStreamInfo.insert("data", (int)audioStream);
				mStreamInfo.insert("frametype", liveStreamInfo->cType);
				mStreamInfo.insert("samplerate", audioStream->uiSampleRate);
				mStreamInfo.insert("samplewidth", audioStream->uiSampleWidth);
				mStreamInfo.insert("audiochannel", liveStreamInfo->cChannel);
				mStreamInfo.insert("acodec", audioStream->sEncode);

				eventProcCall(QString("LiveStream")  , mStreamInfo);
			}

			//��Ƶ
			if (1 == liveStreamInfo->cType || 2 == liveStreamInfo->cType)
			{
				int width = 0;
				int height = 0;

				GetWidthHeight(liveStreamInfo->pData, qToBigEndian(liveStreamInfo->uiLength), &width, &height);	

				mStreamInfo.insert("channel", liveStreamInfo->cChannel);
				mStreamInfo.insert("pts", qToBigEndian(pBubble->uiTicket));
				mStreamInfo.insert("length", qToBigEndian(liveStreamInfo->uiLength));
				mStreamInfo.insert("data", (int)(liveStreamInfo->pData));
				mStreamInfo.insert("frametype", liveStreamInfo->cType);
				mStreamInfo.insert("width", width);
				mStreamInfo.insert("height", height);

				eventProcCall(QString("LiveStream"), mStreamInfo);
			}
			m_buffer.remove(0, m_nTotalBytes);
		}

		if (m_buffer.size() > 5)
		{
			pBubble = (Bubble *)m_buffer.data();
			m_nTotalBytes = qToBigEndian(pBubble->uiLength) + sizeof(pBubble->cHead) + sizeof(pBubble->uiLength);	
		}
		else
		{
			m_nTotalBytes = 1 << (sizeof(int)*8 - 1);
		}

		delete[] dataArr;
		dataArr = NULL;
	}

}


void StreamProcess::analyzeRecordStream()
{
	Bubble *pBubble = NULL;
	Message *pMsg = NULL;
	AuthorityBack *pAutoBack = NULL;
	RecordStream *pRecordStream = NULL;

	while(m_buffer.size() >= m_nTotalBytes)
	{
		char *dataArr = new char[m_nTotalBytes];

		memset(dataArr, 0, m_nTotalBytes);
		memcpy(dataArr, m_buffer.data(), m_nTotalBytes);

		pBubble = (Bubble *)dataArr;

		//verify reback
		if ('\x00' == pBubble->cCmd)
		{
			pMsg = (Message *)(m_buffer.data() + 10);
			if ('\x03' == pMsg->cMessage)
			{
				pAutoBack = (AuthorityBack *)pMsg->pParameters;
				m_nVerifyResult = (int)pAutoBack->cVerified;
				g_verify.wakeOne();
			}
			m_buffer.remove(0, m_nTotalBytes);
		}
		else if('\x02' == pBubble->cCmd)//heartbeat
		{
			m_buffer.remove(0, 11);
		}
		else if ('\x09' == pBubble->cCmd)
		{
			m_buffer.remove(0, 18);
		}
		else if ('\x01' == pBubble->cCmd)//playback stream
		{
			pRecordStream = (RecordStream *)pBubble->pLoad;

			QVariantMap mStreamInfo;

			//��Ƶ
			if (0 == pRecordStream->cType)
			{
				int nLength = qToBigEndian(pRecordStream->nLength) -132 ;
				mStreamInfo.insert("length"         ,nLength);
				mStreamInfo.insert("frametype"      ,pRecordStream->cType);
				mStreamInfo.insert("channel"        ,pRecordStream->cChannel);
				mStreamInfo.insert("audioSampleRate",pRecordStream->nAudioSampleRate);
				mStreamInfo.insert("audioFormat"    ,pRecordStream->cAudioFormat);
				mStreamInfo.insert("audioDataWidth" ,pRecordStream->nAudioDataWidth);
				mStreamInfo.insert("tsp"            ,pRecordStream->nU64TSP);
				mStreamInfo.insert("gentime"        ,pRecordStream->nGenTime);
				int offSet = sizeof(pRecordStream->nLength) + sizeof(pRecordStream->cType) + sizeof(pRecordStream->cChannel) + 128 + 4;
				mStreamInfo.insert("data"           ,(uint)((char*)pRecordStream + offSet));

				eventProcCall(QString("RecordStream")  , mStreamInfo);
			}

			//��Ƶ
			if (1 == pRecordStream->cType || 2 == pRecordStream->cType)
			{
				int nLength = qToBigEndian(pRecordStream->nLength) -128 ;
				mStreamInfo.insert("length"       ,nLength);
				mStreamInfo.insert("frametype"    ,pRecordStream->cType);
				mStreamInfo.insert("channel"      ,pRecordStream->cChannel);
				mStreamInfo.insert("width"        ,pRecordStream->nFrameWidth);
				mStreamInfo.insert("height"       ,pRecordStream->nFrameHeight);
				mStreamInfo.insert("framerate"    ,pRecordStream->nFrameRate);
				mStreamInfo.insert("tsp"          ,pRecordStream->nU64TSP);
				mStreamInfo.insert("gentime"      ,pRecordStream->nGenTime);
				int offSet = sizeof(pRecordStream->nLength) + sizeof(pRecordStream->cType) + sizeof(pRecordStream->cChannel) + 128;
				mStreamInfo.insert("data"         ,(uint)((char*)pRecordStream + offSet));

				eventProcCall(QString("RecordStream"), mStreamInfo);
			}
			m_buffer.remove(0, m_nTotalBytes);
		}

		if (m_buffer.size() > 5)
		{
			pBubble = (Bubble *)m_buffer.data();
			m_nTotalBytes = qToBigEndian(pBubble->uiLength) + sizeof(pBubble->cHead) + sizeof(pBubble->uiLength);	
		}
		else
		{
			m_nTotalBytes = 1 << (sizeof(int)*8 - 1);
		}

		delete[] dataArr;
		dataArr = NULL;
	}
}


int StreamProcess::getVerifyResult()
{
	return m_nVerifyResult;
}

bool StreamProcess::getSupportState()
{
	return m_bIsSupportBubble;
}

int StreamProcess::getStreamListInfo(QList<QList<Stream>> &lstStreamList)
{
	if (m_lstStreamList.isEmpty())
	{
		return 1;
	}
	lstStreamList = m_lstStreamList;
	return 0;
}

void StreamProcess::showError(QAbstractSocket::SocketError sockerror)
{
	QVariantMap mStreamInfo;

	mStreamInfo.insert("connectionStatus", m_tcpSocket->state());
	mStreamInfo.insert("errorValue", m_tcpSocket->error());
	mStreamInfo.insert("errorDescription", m_tcpSocket->errorString());

	eventProcCall(QString("SocketError"), mStreamInfo);
	m_tcpSocket->close();
}

void StreamProcess::stateChanged(QAbstractSocket::SocketState socketState)
{
	QVariantMap mStreamInfo;

	mStreamInfo.insert("status", getSocketState());

	eventProcCall(QString("StateChangeed"), mStreamInfo);
}

void StreamProcess::eventProcCall( QString sEvent,QVariantMap param )
{
	if (m_eventList.contains(sEvent))
	{
		ProcInfoItem eventDes = m_eventMap.value(sEvent);
		if (NULL != eventDes.proc)
		{
			eventDes.proc(sEvent,param,eventDes.puser);
		}
	}
}